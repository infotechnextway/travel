import { WalletModel, IWallet } from './wallet.model';
import { WalletTransactionModel, IWalletTransaction } from './wallet-transaction.model';
import { BaseRepository } from '@shared/repository';

export class WalletRepository extends BaseRepository<IWallet> {
  constructor() {
    super(WalletModel);
  }

  async findByUserId(userId: string): Promise<IWallet | null> {
    return this.model.findOne({ userId }).lean();
  }

  async getOrCreate(userId: string, currency: string = 'INR'): Promise<IWallet> {
    let wallet = await this.findByUserId(userId);
    if (!wallet) {
      wallet = await this.create({ userId, balance: 0, totalCredited: 0, totalDebited: 0, currency, isActive: true } as any);
    }
    return wallet;
  }

  async credit(userId: string, amount: number, source: string, description: string, referenceId?: string, referenceType?: string): Promise<IWallet> {
    const wallet = await this.getOrCreate(userId);
    const newBalance = wallet.balance + amount;
    const newTotalCredited = wallet.totalCredited + amount;

    await this.model.updateOne({ _id: wallet._id }, {
      balance: newBalance,
      totalCredited: newTotalCredited
    });

    await WalletTransactionModel.create({
      walletId: wallet._id,
      userId,
      type: 'credit',
      amount,
      source,
      referenceId,
      referenceType,
      description,
      runningBalance: newBalance
    });

    return this.findById(wallet._id) as Promise<IWallet>;
  }

  async debit(userId: string, amount: number, source: string, description: string, referenceId?: string, referenceType?: string): Promise<IWallet> {
    const wallet = await this.getOrCreate(userId);
    if (wallet.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const newBalance = wallet.balance - amount;
    const newTotalDebited = wallet.totalDebited + amount;

    await this.model.updateOne({ _id: wallet._id }, {
      balance: newBalance,
      totalDebited: newTotalDebited
    });

    await WalletTransactionModel.create({
      walletId: wallet._id,
      userId,
      type: 'debit',
      amount,
      source,
      referenceId,
      referenceType,
      description,
      runningBalance: newBalance
    });

    return this.findById(wallet._id) as Promise<IWallet>;
  }

  async getTransactions(userId: string, page: number = 1, limit: number = 20): Promise<{ transactions: IWalletTransaction[]; total: number }> {
    const wallet = await this.findByUserId(userId);
    if (!wallet) return { transactions: [], total: 0 };

    const [transactions, total] = await Promise.all([
      WalletTransactionModel.find({ walletId: wallet._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      WalletTransactionModel.countDocuments({ walletId: wallet._id })
    ]);
    return { transactions, total };
  }
}
