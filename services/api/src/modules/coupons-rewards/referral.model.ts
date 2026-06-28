import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IReferral extends Document {
  _id: string;
  code: string;
  referrerId: string;
  refereeId?: string;
  status: 'pending' | 'registered' | 'booked' | 'completed' | 'expired';
  referrerBonusPoints: number;
  referrerBonusWallet: number;
  refereeBonusPoints: number;
  refereeBonusWallet: number;
  refereeSignUpDate?: Date;
  refereeFirstBookingId?: string;
  refereeFirstBookingAmount?: number;
  bonusesDistributed: boolean;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    _id: { type: String, default: () => uuidv4() },
    code: { type: String, required: true, unique: true, index: true },
    referrerId: { type: String, required: true, ref: 'User', index: true },
    refereeId: { type: String, ref: 'User', index: true, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'registered', 'booked', 'completed', 'expired'],
      default: 'pending',
      index: true
    },
    referrerBonusPoints: { type: Number, default: 500, min: 0 },
    referrerBonusWallet: { type: Number, default: 0, min: 0 },
    refereeBonusPoints: { type: Number, default: 500, min: 0 },
    refereeBonusWallet: { type: Number, default: 0, min: 0 },
    refereeSignUpDate: { type: Date },
    refereeFirstBookingId: { type: String, ref: 'Booking' },
    refereeFirstBookingAmount: { type: Number, min: 0 },
    bonusesDistributed: { type: Boolean, default: false },
    expiryDate: { type: Date, required: true }
  },
  { timestamps: true }
);

ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ refereeId: 1, status: 1 });
ReferralSchema.index({ expiryDate: 1 });

export const ReferralModel: Model<IReferral> = mongoose.model<IReferral>('Referral', ReferralSchema);
