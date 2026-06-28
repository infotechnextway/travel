import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IRewardTransaction extends Document {
  _id: string;
  userId: string;
  type: 'earned' | 'burned' | 'expired' | 'bonus' | 'reversed';
  points: number;
  source: 'booking' | 'referral' | 'tier_bonus' | 'promotion' | 'manual' | 'review' | 'signup';
  referenceId?: string;
  referenceType?: 'booking' | 'referral' | 'review' | 'coupon';
  description: string;
  runningPoints: number;
  expiryDate?: Date;
  isExpired: boolean;
  createdAt: Date;
}

const RewardTransactionSchema = new Schema<IRewardTransaction>(
  {
    _id: { type: String, default: () => uuidv4() },
    userId: { type: String, required: true, ref: 'User', index: true },
    type: { type: String, enum: ['earned', 'burned', 'expired', 'bonus', 'reversed'], required: true },
    points: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      enum: ['booking', 'referral', 'tier_bonus', 'promotion', 'manual', 'review', 'signup'],
      required: true
    },
    referenceId: { type: String, index: true },
    referenceType: { type: String, enum: ['booking', 'referral', 'review', 'coupon'] },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    runningPoints: { type: Number, required: true },
    expiryDate: { type: Date },
    isExpired: { type: Boolean, default: false }
  },
  { timestamps: true }
);

RewardTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
RewardTransactionSchema.index({ userId: 1, isExpired: 1, expiryDate: 1 });
RewardTransactionSchema.index({ referenceId: 1, referenceType: 1 });

export const RewardTransactionModel: Model<IRewardTransaction> = mongoose.model<IRewardTransaction>('RewardTransaction', RewardTransactionSchema);
