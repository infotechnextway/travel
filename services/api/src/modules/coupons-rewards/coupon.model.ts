import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ICoupon extends Document {
  _id: string;
  code: string;
  type: 'global' | 'vendor';
  vendorId?: string;
  discountType: 'percent' | 'flat' | 'cashback';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  cashbackPercent?: number;
  usageLimitTotal: number;
  usageLimitPerUser: number;
  usedCount: number;
  applicableListingTypes: string[];
  applicableVendorIds?: string[];
  applicableListingIds?: string[];
  excludedListingIds?: string[];
  firstTimeOnly: boolean;
  newUserOnly: boolean;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: string;
  description?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    _id: { type: String, default: () => uuidv4() },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ['global', 'vendor'], required: true, index: true },
    vendorId: { type: String, ref: 'Vendor', index: true },
    discountType: { type: String, enum: ['percent', 'flat', 'cashback'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    cashbackPercent: { type: Number, min: 0, max: 100 },
    usageLimitTotal: { type: Number, required: true, min: 1 },
    usageLimitPerUser: { type: Number, required: true, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    applicableListingTypes: [{ type: String, enum: ['tour', 'activity', 'hotel', 'transport'] }],
    applicableVendorIds: [{ type: String, ref: 'Vendor' }],
    applicableListingIds: [{ type: String, ref: 'Listing' }],
    excludedListingIds: [{ type: String, ref: 'Listing' }],
    firstTimeOnly: { type: Boolean, default: false },
    newUserOnly: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true, ref: 'User' },
    description: { type: String, trim: true, maxlength: 500 },
    terms: { type: String, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

// Compound indexes
CouponSchema.index({ isActive: 1, endDate: 1 });
CouponSchema.index({ type: 1, vendorId: 1, isActive: 1 });
CouponSchema.index({ applicableListingTypes: 1, isActive: 1 });

export const CouponModel: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', CouponSchema);
