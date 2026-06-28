import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Currency } from '@shared/enums';

export interface IWallet extends Document {
  _id: string;
  userId: string;
  balance: number;
  totalCredited: number;
  totalDebited: number;
  currency: Currency;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    _id: { type: String, default: () => uuidv4() },
    userId: { type: String, required: true, unique: true, ref: 'User', index: true },
    balance: { type: Number, default: 0, min: 0 },
    totalCredited: { type: Number, default: 0, min: 0 },
    totalDebited: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: Object.values(Currency), default: Currency.INR },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const WalletModel: Model<IWallet> = mongoose.model<IWallet>('Wallet', WalletSchema);
