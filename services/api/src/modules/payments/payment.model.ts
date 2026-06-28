import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus, Currency } from '@shared/enums';

export interface IPayment extends Document {
  _id: string;
  bookingId: string;
  userId: string;
  gateway: 'razorpay' | 'stripe' | 'wallet' | 'upi' | 'cash';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  method?: string;
  cardDetails?: {
    last4?: string;
    network?: string;
    emi?: boolean;
    tenure?: number;
  };
  upiDetails?: {
    vpa?: string;
    provider?: string;
  };
  netbankingDetails?: {
    bank?: string;
    code?: string;
  };
  walletDetails?: {
    provider?: string;
  };
  receiptUrl?: string;
  invoiceId?: string;
  failureReason?: string;
  webhookPayload?: string; // encrypted JSON
  refundId?: string;
  refundAmount?: number;
  refundStatus?: 'none' | 'pending' | 'processed' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    _id: { type: String, default: () => uuidv4() },
    bookingId: { type: String, required: true, ref: 'Booking', index: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    gateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'wallet', 'upi', 'cash'],
      required: true,
      index: true
    },
    gatewayOrderId: { type: String, unique: true, sparse: true, index: true },
    gatewayPaymentId: { type: String, unique: true, sparse: true, index: true },
    gatewaySignature: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: Object.values(Currency), default: Currency.INR },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true
    },
    method: { type: String },
    cardDetails: {
      last4: { type: String },
      network: { type: String },
      emi: { type: Boolean, default: false },
      tenure: { type: Number }
    },
    upiDetails: {
      vpa: { type: String },
      provider: { type: String }
    },
    netbankingDetails: {
      bank: { type: String },
      code: { type: String }
    },
    walletDetails: {
      provider: { type: String }
    },
    receiptUrl: { type: String },
    invoiceId: { type: String, ref: 'Invoice', index: true },
    failureReason: { type: String },
    webhookPayload: { type: String },
    refundId: { type: String },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed', 'failed'],
      default: 'none',
      index: true
    },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Compound indexes
PaymentSchema.index({ userId: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ bookingId: 1, status: 1 });
PaymentSchema.index({ gateway: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ createdAt: -1 });

export const PaymentModel: Model<IPayment> = mongoose.model<IPayment>('Payment', PaymentSchema);
