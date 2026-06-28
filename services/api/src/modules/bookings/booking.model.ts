import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { BookingStatus, PaymentStatus, Currency } from '@shared/enums';

export interface ITraveler {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  passportNumber?: string;
  aadhaarNumber?: string;
  dietaryRestrictions?: string[];
  specialNeeds?: string;
  isPrimary: boolean;
}

export interface IBookingGst {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface ICancellationPolicySnapshot {
  policyType: 'flexible' | 'moderate' | 'strict' | 'non_refundable';
  freeCancellationHours: number;
  partialRefundHours: number;
  partialRefundPercent: number;
  noRefundHours: number;
  description: string;
}

export interface IRefundBreakdown {
  refundAmount: number;
  penaltyAmount: number;
  platformFeeRetained: number;
  commissionRetained: number;
  gstOnCommission: number;
  netRefundToCustomer: number;
  refundMethod: 'original' | 'wallet';
  processedAt?: Date;
}

export interface IBooking extends Document {
  _id: string;
  bookingCode: string;
  customerId: string;
  listingId: string;
  vendorId: string;
  guideId?: string;
  status: BookingStatus;
  travelDates: {
    startDate: Date;
    endDate: Date;
  };
  travelers: ITraveler[];
  totalAmount: number;
  discountAmount: number;
  taxAmount: IBookingGst;
  platformFee: number;
  commissionAmount: number;
  vendorPayoutAmount: number;
  finalAmount: number;
  currency: Currency;
  couponCode?: string;
  couponDiscount?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  specialRequests?: string;
  cancellationReason?: string;
  cancellationPolicySnapshot: ICancellationPolicySnapshot;
  refundAmount: number;
  refundStatus: 'none' | 'requested' | 'approved' | 'processed' | 'rejected';
  refundBreakdown?: IRefundBreakdown;
  inventoryLockExpiry?: Date;
  vendorConfirmed: boolean;
  vendorConfirmedAt?: Date;
  completedAt?: Date;
  reviewedAt?: Date;
  penaltyAmount: number;
  metadata: {
    listingTitle: string;
    listingType: string;
    destinationName: string;
    vendorName: string;
    guideName?: string;
    originalPrice: number;
    pricePerPerson: number;
  };
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TravelerSchema = new Schema<ITraveler>({
  _id: { type: String, default: () => uuidv4() },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  passportNumber: { type: String, trim: true, uppercase: true },
  aadhaarNumber: { type: String, trim: true, match: /^\d{12}$/ },
  dietaryRestrictions: [{ type: String, trim: true }],
  specialNeeds: { type: String, trim: true, maxlength: 500 },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const GstSchema = new Schema<IBookingGst>({
  cgst: { type: Number, default: 0, min: 0 },
  sgst: { type: Number, default: 0, min: 0 },
  igst: { type: Number, default: 0, min: 0 },
  totalTax: { type: Number, default: 0, min: 0 }
}, { _id: false });

const CancellationPolicySnapshotSchema = new Schema<ICancellationPolicySnapshot>({
  policyType: { type: String, enum: ['flexible', 'moderate', 'strict', 'non_refundable'], required: true },
  freeCancellationHours: { type: Number, default: 0 },
  partialRefundHours: { type: Number, default: 0 },
  partialRefundPercent: { type: Number, default: 0, min: 0, max: 100 },
  noRefundHours: { type: Number, default: 0 },
  description: { type: String }
}, { _id: false });

const RefundBreakdownSchema = new Schema<IRefundBreakdown>({
  refundAmount: { type: Number, required: true, min: 0 },
  penaltyAmount: { type: Number, required: true, min: 0 },
  platformFeeRetained: { type: Number, default: 0, min: 0 },
  commissionRetained: { type: Number, default: 0, min: 0 },
  gstOnCommission: { type: Number, default: 0, min: 0 },
  netRefundToCustomer: { type: Number, required: true, min: 0 },
  refundMethod: { type: String, enum: ['original', 'wallet'], required: true },
  processedAt: { type: Date }
}, { _id: false });

const BookingSchema = new Schema<IBooking>(
  {
    _id: { type: String, default: () => uuidv4() },
    bookingCode: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, ref: 'User', index: true },
    listingId: { type: String, required: true, ref: 'Listing', index: true },
    vendorId: { type: String, required: true, ref: 'Vendor', index: true },
    guideId: { type: String, ref: 'Guide', index: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true
    },
    travelDates: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    travelers: { type: [TravelerSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: GstSchema, default: () => ({ cgst: 0, sgst: 0, igst: 0, totalTax: 0 }) },
    platformFee: { type: Number, default: 0, min: 0 },
    commissionAmount: { type: Number, default: 0, min: 0 },
    vendorPayoutAmount: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: Object.values(Currency), default: Currency.INR },
    couponCode: { type: String, index: true },
    couponDiscount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true
    },
    paymentMethod: { type: String },
    specialRequests: { type: String, trim: true, maxlength: 1000 },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    cancellationPolicySnapshot: { type: CancellationPolicySnapshotSchema },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'processed', 'rejected'],
      default: 'none',
      index: true
    },
    refundBreakdown: { type: RefundBreakdownSchema },
    inventoryLockExpiry: { type: Date, index: true },
    vendorConfirmed: { type: Boolean, default: false },
    vendorConfirmedAt: { type: Date },
    completedAt: { type: Date },
    reviewedAt: { type: Date },
    penaltyAmount: { type: Number, default: 0, min: 0 },
    metadata: {
      listingTitle: { type: String, required: true },
      listingType: { type: String, required: true },
      destinationName: { type: String },
      vendorName: { type: String },
      guideName: { type: String },
      originalPrice: { type: Number, required: true },
      pricePerPerson: { type: Number, required: true }
    },
    adminNotes: { type: String, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

// Compound indexes
BookingSchema.index({ customerId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ listingId: 1, status: 1 });
BookingSchema.index({ travelDates: 1 });
BookingSchema.index({ status: 1, travelDates: 1 });
BookingSchema.index({ refundStatus: 1, status: 1 });
BookingSchema.index({ 'travelDates.startDate': 1, status: 1 });
BookingSchema.index({ createdAt: -1 });

// Text index for admin search
BookingSchema.index({ bookingCode: 'text', 'metadata.listingTitle': 'text', specialRequests: 'text' });

// Pre-save hook to generate booking code
BookingSchema.pre('save', async function (next) {
  if (this.isNew && !this.bookingCode) {
    const date = new Date();
    const prefix = 'ITM';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingCode = `${prefix}${year}${month}${day}-${random}`;
  }
  next();
});

export const BookingModel: Model<IBooking> = mongoose.model<IBooking>('Booking', BookingSchema);
