import { RewardRepository } from './reward.repository';
import { RewardTransactionModel, IRewardTransaction } from './reward-transaction.model';
import { WalletRepository } from '@modules/payments/wallet.repository';
import { AppError, NotFoundError, ConflictError, ValidationError } from '@shared/errors';

export type UserTier = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIER_THRESHOLDS: Record<UserTier, number> = {
  bronze: 0,
  silver: 5000,
  gold: 25000,
  platinum: 100000
};

const TIER_MULTIPLIERS: Record<UserTier, number> = {
  bronze: 1.0,
  silver: 1.25,
  gold: 1.5,
  platinum: 2.0
};

export class RewardService {
  constructor(
    private rewardRepo: RewardRepository,
    private walletRepo: WalletRepository
  ) {}

  // ─── POINTS EARNING ───

  async earnPoints(userId: string, source: string, amount: number, referenceId?: string, referenceType?: string): Promise<IRewardTransaction> {
    const basePoints = Math.floor(amount / 10); // 1 point per ₹10 spent
    const tier = await this.getUserTier(userId);
    const multiplier = TIER_MULTIPLIERS[tier];
    const points = Math.floor(basePoints * multiplier);

    const currentBalance = await this.rewardRepo.getUserPoints(userId);
    const runningPoints = currentBalance + points;

    const transaction = await this.rewardRepo.create({
      userId,
      type: 'earned',
      points,
      source: source as any,
      referenceId,
      referenceType: referenceType as any,
      description: `Earned ${points} points for ${source}`,
      runningPoints,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
    } as any);

    return transaction;
  }

  async earnPointsOnBooking(userId: string, bookingId: string, amount: number): Promise<IRewardTransaction> {
    return this.earnPoints(userId, 'booking', amount, bookingId, 'booking');
  }

  async earnPointsOnReview(userId: string, reviewId: string): Promise<IRewardTransaction> {
    return this.earnPoints(userId, 'review', 100, reviewId, 'review'); // Fixed 100 points for review
  }

  async earnSignupBonus(userId: string): Promise<IRewardTransaction> {
    const currentBalance = await this.rewardRepo.getUserPoints(userId);
    return this.rewardRepo.create({
      userId,
      type: 'bonus',
      points: 200,
      source: 'signup',
      description: 'Welcome bonus for signing up',
      runningPoints: currentBalance + 200,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    } as any);
  }

  // ─── POINTS BURNING ───

  async burnPoints(userId: string, points: number, bookingId: string): Promise<{ discountValue: number; transaction: IRewardTransaction }> {
    const currentBalance = await this.rewardRepo.getUserPoints(userId);
    if (currentBalance < points) throw new ValidationError('Insufficient points balance');

    const discountValue = points; // 1 point = ₹1
    const runningPoints = currentBalance - points;

    const transaction = await this.rewardRepo.create({
      userId,
      type: 'burned',
      points,
      source: 'booking',
      referenceId: bookingId,
      referenceType: 'booking',
      description: `Redeemed ${points} points for ₹${discountValue} discount`,
      runningPoints
    } as any);

    return { discountValue, transaction };
  }

  // ─── TIER SYSTEM ───

  async getUserTier(userId: string): Promise<UserTier> {
    const lifetimePoints = await this.rewardRepo.getLifetimePoints(userId);
    if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
    if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  async getTierProgress(userId: string): Promise<{ tier: UserTier; lifetimePoints: number; nextTier: UserTier | null; pointsToNext: number; multiplier: number }> {
    const lifetimePoints = await this.rewardRepo.getLifetimePoints(userId);
    const tier = await this.getUserTier(userId);
    const tiers: UserTier[] = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(tier);
    const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
    const pointsToNext = nextTier ? TIER_THRESHOLDS[nextTier] - lifetimePoints : 0;

    return {
      tier,
      lifetimePoints,
      nextTier,
      pointsToNext: Math.max(0, pointsToNext),
      multiplier: TIER_MULTIPLIERS[tier]
    };
  }

  // ─── WALLET INTEGRATION ───

  async creditCashbackToWallet(userId: string, amount: number, source: string, referenceId?: string): Promise<any> {
    return this.walletRepo.credit(userId, amount, source as any, `Cashback credited: ${source}`, referenceId, 'booking');
  }

  // ─── QUERIES ───

  async getUserPoints(userId: string): Promise<{ balance: number; lifetime: number; expiringSoon: number; tier: UserTier; progress: any }> {
    const [balance, lifetime, expiringSoon, tier, progress] = await Promise.all([
      this.rewardRepo.getUserPoints(userId),
      this.rewardRepo.getLifetimePoints(userId),
      this.rewardRepo.getPointsExpiringSoon(userId, 30),
      this.getUserTier(userId),
      this.getTierProgress(userId)
    ]);

    return { balance, lifetime, expiringSoon, tier, progress };
  }

  async getTransactions(userId: string, page: number, limit: number): Promise<{ transactions: IRewardTransaction[]; total: number }> {
    return this.rewardRepo.getTransactions(userId, page, limit);
  }

  // ─── ADMIN ───

  async manualCredit(userId: string, points: number, description: string, expiryDays: number = 365): Promise<IRewardTransaction> {
    const currentBalance = await this.rewardRepo.getUserPoints(userId);
    const runningPoints = currentBalance + points;

    return this.rewardRepo.create({
      userId,
      type: 'bonus',
      points,
      source: 'manual',
      description,
      runningPoints,
      expiryDate: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    } as any);
  }

  async manualDebit(userId: string, points: number, description: string): Promise<IRewardTransaction> {
    const currentBalance = await this.rewardRepo.getUserPoints(userId);
    if (currentBalance < points) throw new ValidationError('Insufficient points');
    const runningPoints = currentBalance - points;

    return this.rewardRepo.create({
      userId,
      type: 'burned',
      points,
      source: 'manual',
      description,
      runningPoints
    } as any);
  }

  async expireOldPoints(): Promise<{ expired: number }> {
    const expired = await this.rewardRepo.expirePoints();
    return { expired };
  }

  async getAllTransactions(filters: any): Promise<{ transactions: IRewardTransaction[]; total: number }> {
    const query: any = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.type) query.type = filters.type;
    if (filters.source) query.source = filters.source;

    const [transactions, total] = await Promise.all([
      this.rewardRepo.model.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
      this.rewardRepo.model.countDocuments(query)
    ]);
    return { transactions, total };
  }

  async getTopEarners(limit: number = 100): Promise<any[]> {
    return this.rewardRepo.getTopEarners(limit);
  }
}
