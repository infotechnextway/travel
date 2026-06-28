import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ICouponRedemption extends Document {
  _id: string;
  couponId: string;
  userId: string;
  bookingId: string;
  discountAmount: number;
  createdAt: Date;
}

const CouponRedemptionSchema = new Schema<ICouponRedemption>(
  {
    _id: { type: String, default: () => uuidv4() },
    couponId: { type: String, required: true, ref: 'Coupon', index: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    bookingId: { type: String, required: true, ref: 'Booking', index: true },
    discountAmount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

CouponRedemptionSchema.index({ couponId: 1, userId: 1 });
CouponRedemptionSchema.index({ userId: 1, createdAt: -1 });

export const CouponRedemptionModel: Model<ICouponRedemption> = mongoose.model<ICouponRedemption>('CouponRedemption', CouponRedemptionSchema);
