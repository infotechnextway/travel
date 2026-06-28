import mongoose, { Schema, Document, Model } from 'mongoose';
import { VerificationStatus } from '../../shared/enums';

export interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType: 'savings' | 'current';
}

export interface IVendorDocument extends Document {
  _id: string;
  userId: string;
  businessName: string;
  businessType: string;
  gstin?: string;
  pan: string;
  registrationNumber?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  verificationStatus: VerificationStatus;
  commissionRate: number;
  bankDetails: IBankDetails;
  payoutSchedule: 'weekly' | 'biweekly' | 'monthly';
  rating: number;
  totalBookings: number;
  totalRevenue: number;
  responseTimeMinutes: number;
  responseRate: number;
  isActive: boolean;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  contactEmail: string;
  contactPhone: string;
  website?: string;
  socialLinks?: Record<string, string>;
  documents: Array<{
    type: string;
    url: string;
    verifiedAt?: Date;
  }>;
  onboardingNotes?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BankDetailsSchema = new Schema<IBankDetails>(
  {
    accountHolderName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ifscCode: { type: String, required: true, trim: true, match: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
    bankName: { type: String, required: true, trim: true },
    branchName: { type: String, trim: true },
    accountType: { type: String, enum: ['savings', 'current'], required: true },
  },
  { _id: false }
);

const VendorSchema = new Schema<IVendorDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    userId: { type: String, required: true, ref: 'User', index: true },
    businessName: { type: String, required: true, trim: true, maxlength: 100 },
    businessType: { type: String, required: true, trim: true },
    gstin: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    },
    pan: {
      type: String,
      required: true,
      trim: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    },
    registrationNumber: { type: String, trim: true },
    description: { type: String, maxlength: 2000 },
    logo: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.DRAFT,
    },
    commissionRate: { type: Number, default: 0.15, min: 0, max: 1 },
    bankDetails: { type: BankDetailsSchema, required: true },
    payoutSchedule: { type: String, enum: ['weekly', 'biweekly', 'monthly'], default: 'monthly' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalBookings: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    responseTimeMinutes: { type: Number, default: 0, min: 0 },
    responseRate: { type: Number, default: 0, min: 0, max: 1 },
    isActive: { type: Boolean, default: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' },
    },
    address: {
      line1: { type: String, required: true, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
    },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    socialLinks: { type: Map, of: String },
    documents: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
        verifiedAt: { type: Date },
      },
    ],
    onboardingNotes: { type: String, maxlength: 2000 },
    adminNotes: { type: String, maxlength: 2000 },
    reviewedBy: { type: String, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
VendorSchema.index({ userId: 1 }, { unique: true, name: 'idx_vendor_user' });
VendorSchema.index({ verificationStatus: 1, createdAt: -1 }, { name: 'idx_vendor_verification' });
VendorSchema.index({ gstin: 1 }, { unique: true, sparse: true, name: 'idx_vendor_gstin' });
VendorSchema.index({ location: '2dsphere' }, { name: 'idx_vendor_geo' });
VendorSchema.index({ rating: -1, totalBookings: -1 }, { name: 'idx_vendor_popularity' });
VendorSchema.index({ isActive: 1, verificationStatus: 1 }, { name: 'idx_vendor_active_verified' });
VendorSchema.index({ 'address.city': 1, 'address.state': 1 }, { name: 'idx_vendor_location' });
VendorSchema.index({ businessName: 'text', description: 'text' }, { name: 'idx_vendor_text', weights: { businessName: 10, description: 3 } });

export const Vendor: Model<IVendorDocument> = mongoose.model<IVendorDocument>('Vendor', VendorSchema);
