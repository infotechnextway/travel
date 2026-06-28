import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Currency } from '@shared/enums';

export interface IWalletTransaction extends Document {
  _id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  source: 'booking' | 'refund' | 'reward' | 'referral' | 'payout' | 'topup' | 'withdrawal' | 'adjustment';
  referenceId?: string;
  referenceType?: 'booking' | 'payment' | 'payout' | 'coupon' | 'referral';
  description: string;
  runningBalance: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    _id: { type: String, default: () => uuidv4() },
    walletId: { type: String, required: true, ref: 'Wallet', index: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      enum: ['booking', 'refund', 'reward', 'referral', 'payout', 'topup', 'withdrawal', 'adjustment'],
      required: true
    },
    referenceId: { type: String, index: true },
    referenceType: { type: String, enum: ['booking', 'payment', 'payout', 'coupon', 'referral'] },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    runningBalance: { type: Number, required: true, min: 0 },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Compound indexes
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ source: 1, createdAt: -1 });
WalletTransactionSchema.index({ referenceId: 1, referenceType: 1 });

export const WalletTransactionModel: Model<IWalletTransaction> = mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
