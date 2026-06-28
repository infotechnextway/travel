import { RewardTransactionModel, IRewardTransaction } from './reward-transaction.model';
import { BaseRepository } from '@shared/repository';

export class RewardRepository extends BaseRepository<IRewardTransaction> {
  constructor() {
    super(RewardTransactionModel);
  }

  async getUserPoints(userId: string): Promise<number> {
    const result = await RewardTransactionModel.aggregate([
      { $match: { userId, isExpired: false } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $in: ['$type', ['earned', 'bonus']] },
                '$points',
                { $multiply: ['$points', -1] }
              ]
            }
          }
        }
      }
    ]);
    return result[0]?.total || 0;
  }

  async getTransactions(userId: string, page: number = 1, limit: number = 20): Promise<{ transactions: IRewardTransaction[]; total: number }> {
    const [transactions, total] = await Promise.all([
      RewardTransactionModel.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      RewardTransactionModel.countDocuments({ userId })
    ]);
    return { transactions, total };
  }

  async getLifetimePoints(userId: string): Promise<number> {
    const result = await RewardTransactionModel.aggregate([
      { $match: { userId, type: { $in: ['earned', 'bonus'] } } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    return result[0]?.total || 0;
  }

  async getPointsExpiringSoon(userId: string, days: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const result = await RewardTransactionModel.aggregate([
      { $match: { userId, type: 'earned', isExpired: false, expiryDate: { $lte: cutoff, $gte: new Date() } } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    return result[0]?.total || 0;
  }

  async expirePoints(): Promise<number> {
    const now = new Date();
    const result = await RewardTransactionModel.updateMany(
      { type: 'earned', isExpired: false, expiryDate: { $lte: now } },
      { isExpired: true }
    );
    return result.modifiedCount;
  }

  async getTopEarners(limit: number = 100): Promise<any[]> {
    return RewardTransactionModel.aggregate([
      { $match: { type: { $in: ['earned', 'bonus'] } } },
      { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
      { $sort: { totalPoints: -1 } },
      { $limit: limit }
    ]);
  }
}
