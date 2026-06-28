import { ReferralModel, IReferral } from './referral.model';
import { BaseRepository } from '@shared/repository';

export class ReferralRepository extends BaseRepository<IReferral> {
  constructor() {
    super(ReferralModel);
  }

  async findByCode(code: string): Promise<IReferral | null> {
    return this.model.findOne({ code: code.toUpperCase().trim() }).lean();
  }

  async findByReferrerId(referrerId: string): Promise<IReferral[]> {
    return this.model.find({ referrerId }).sort({ createdAt: -1 }).lean();
  }

  async findByRefereeId(refereeId: string): Promise<IReferral | null> {
    return this.model.findOne({ refereeId }).lean();
  }

  async getReferrerStats(referrerId: string): Promise<any> {
    const [total, byStatus, totalBonuses] = await Promise.all([
      this.model.countDocuments({ referrerId }),
      this.model.aggregate([
        { $match: { referrerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      this.model.aggregate([
        { $match: { referrerId, bonusesDistributed: true } },
        { $group: { _id: null, points: { $sum: '$referrerBonusPoints' }, wallet: { $sum: '$referrerBonusWallet' } } }
      ])
    ]);

    return {
      totalReferrals: total,
      byStatus: byStatus.reduce((acc: any, s: any) => ({ ...acc, [s._id]: s.count }), {}),
      totalBonusPoints: totalBonuses[0]?.points || 0,
      totalBonusWallet: totalBonuses[0]?.wallet || 0
    };
  }

  async getPlatformReferralStats(): Promise<any> {
    const [total, byStatus, totalBonuses] = await Promise.all([
      this.model.countDocuments(),
      this.model.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      this.model.aggregate([
        { $match: { bonusesDistributed: true } },
        { $group: { _id: null, referrerPoints: { $sum: '$referrerBonusPoints' }, referrerWallet: { $sum: '$referrerBonusWallet' }, refereePoints: { $sum: '$refereeBonusPoints' }, refereeWallet: { $sum: '$refereeBonusWallet' } } }
      ])
    ]);

    return {
      totalReferrals: total,
      byStatus: byStatus.reduce((acc: any, s: any) => ({ ...acc, [s._id]: s.count }), {}),
      totalBonusesDistributed: totalBonuses[0] || { referrerPoints: 0, referrerWallet: 0, refereePoints: 0, refereeWallet: 0 }
    };
  }

  async expirePendingReferrals(): Promise<number> {
    const now = new Date();
    const result = await this.model.updateMany(
      { status: 'pending', expiryDate: { $lte: now } },
      { status: 'expired' }
    );
    return result.modifiedCount;
  }
}
