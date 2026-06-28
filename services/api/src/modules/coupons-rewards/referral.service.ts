import { ReferralRepository } from './referral.repository';
import { IReferral } from './referral.model';
import { RewardService } from './reward.service';
import { WalletRepository } from '@modules/payments/wallet.repository';
import { AppError, NotFoundError, ConflictError, ValidationError } from '@shared/errors';

export class ReferralService {
  constructor(
    private referralRepo: ReferralRepository,
    private rewardService: RewardService,
    private walletRepo: WalletRepository
  ) {}

  // ─── CODE GENERATION ───

  async generateReferralCode(userId: string, name: string): Promise<IReferral> {
    const existing = await this.referralRepo.findByReferrerId(userId);
    if (existing.length > 0) return existing[0]; // Return existing code

    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${sanitizedName}${year}${random}`;

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

    return this.referralRepo.create({
      code,
      referrerId: userId,
      status: 'pending',
      referrerBonusPoints: 500,
      referrerBonusWallet: 0,
      refereeBonusPoints: 500,
      refereeBonusWallet: 0,
      expiryDate
    } as any);
  }

  async getMyReferralCode(userId: string, name: string): Promise<{ code: string; link: string; stats: any }> {
    const referral = await this.generateReferralCode(userId, name);
    const stats = await this.referralRepo.getReferrerStats(userId);
    const link = `https://indiatravel.market/ref/${referral.code}`;
    return { code: referral.code, link, stats };
  }

  // ─── REFEREE REGISTRATION ───

  async applyReferralCode(refereeId: string, code: string): Promise<{ referrerId: string; refereeBonusPoints: number; refereeBonusWallet: number }> {
    const referral = await this.referralRepo.findByCode(code);
    if (!referral) throw new NotFoundError('Invalid referral code');
    if (referral.status === 'expired') throw new ValidationError('Referral code has expired');
    if (referral.referrerId === refereeId) throw new ValidationError('Cannot use your own referral code');
    if (referral.refereeId) throw new ConflictError('Referral code already used');

    const now = new Date();
    if (now > referral.expiryDate) {
      await this.referralRepo.update(referral._id, { status: 'expired' });
      throw new ValidationError('Referral code has expired');
    }

    await this.referralRepo.update(referral._id, {
      refereeId,
      status: 'registered',
      refereeSignUpDate: new Date()
    });

    // Credit referee bonus immediately on signup
    if (referral.refereeBonusPoints > 0) {
      await this.rewardService.manualCredit(refereeId, referral.refereeBonusPoints, `Referral bonus from ${referral.code}`, 365);
    }
    if (referral.refereeBonusWallet > 0) {
      await this.walletRepo.credit(refereeId, referral.refereeBonusWallet, 'referral', `Referral wallet bonus from ${referral.code}`, referral._id, 'referral');
    }

    return {
      referrerId: referral.referrerId,
      refereeBonusPoints: referral.refereeBonusPoints,
      refereeBonusWallet: referral.refereeBonusWallet
    };
  }

  // ─── BOOKING COMPLETION BONUS ───

  async trackFirstBooking(refereeId: string, bookingId: string, bookingAmount: number): Promise<void> {
    const referral = await this.referralRepo.findByRefereeId(refereeId);
    if (!referral) return; // No referral used
    if (referral.status === 'completed' || referral.status === 'expired') return;
    if (referral.bonusesDistributed) return;

    await this.referralRepo.update(referral._id, {
      status: 'booked',
      refereeFirstBookingId: bookingId,
      refereeFirstBookingAmount: bookingAmount
    });

    // Distribute referrer bonus on first booking
    if (referral.referrerBonusPoints > 0) {
      await this.rewardService.manualCredit(referral.referrerId, referral.referrerBonusPoints, `Referral bonus for referring ${refereeId}`, 365);
    }
    if (referral.referrerBonusWallet > 0) {
      await this.walletRepo.credit(referral.referrerId, referral.referrerBonusWallet, 'referral', `Referral wallet bonus for referring ${refereeId}`, referral._id, 'referral');
    }

    await this.referralRepo.update(referral._id, { bonusesDistributed: true, status: 'completed' });
  }

  // ─── QUERIES ───

  async getMyReferrals(userId: string): Promise<{ referrals: IReferral[]; stats: any }> {
    const referrals = await this.referralRepo.findByReferrerId(userId);
    const stats = await this.referralRepo.getReferrerStats(userId);
    return { referrals, stats };
  }

  async getReferralByCode(code: string): Promise<IReferral | null> {
    return this.referralRepo.findByCode(code);
  }

  // ─── ADMIN ───

  async searchReferrals(filters: any): Promise<{ referrals: IReferral[]; total: number }> {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.referrerId) query.referrerId = filters.referrerId;

    const [referrals, total] = await Promise.all([
      this.referralRepo.model.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
      this.referralRepo.model.countDocuments(query)
    ]);
    return { referrals, total };
  }

  async updateBonusSettings(referralId: string, dto: any): Promise<IReferral> {
    const referral = await this.referralRepo.findById(referralId);
    if (!referral) throw new NotFoundError('Referral not found');
    return this.referralRepo.update(referralId, dto) as Promise<IReferral>;
  }

  async getPlatformStats(): Promise<any> {
    return this.referralRepo.getPlatformReferralStats();
  }

  async expirePendingReferrals(): Promise<{ expired: number }> {
    const expired = await this.referralRepo.expirePendingReferrals();
    return { expired };
  }
}
