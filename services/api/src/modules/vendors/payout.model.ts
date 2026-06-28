import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayoutDocument extends Document {
  _id: string;
  vendorId: string;
  bookingIds: string[];
  periodStart: Date;
  periodEnd: Date;
  totalBookings: number;
  grossAmount: number;
  platformCommission: number;
  gstOnCommission: number;
  tdsAmount: number;
  netPayout: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  bankReference?: string;
  failureReason?: string;
  processedAt?: Date;
  processedBy?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  gstInvoiceNumber?: string;
  gstInvoiceUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayoutDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    vendorId: { type: String, required: true, ref: 'Vendor', index: true },
    bookingIds: { type: [String], ref: 'Booking', default: [], index: true },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    totalBookings: { type: Number, required: true, min: 0 },
    grossAmount: { type: Number, required: true, min: 0 },
    platformCommission: { type: Number, required: true, min: 0 },
    gstOnCommission: { type: Number, required: true, min: 0 },
    tdsAmount: { type: Number, default: 0, min: 0 },
    netPayout: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending', index: true },
    transactionId: { type: String, sparse: true, index: true },
    bankReference: { type: String },
    failureReason: { type: String },
    processedAt: { type: Date },
    processedBy: { type: String, ref: 'User' },
    invoiceNumber: { type: String, unique: true, sparse: true },
    invoiceUrl: { type: String },
    gstInvoiceNumber: { type: String, unique: true, sparse: true },
    gstInvoiceUrl: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

PayoutSchema.index({ vendorId: 1, status: 1, createdAt: -1 }, { name: 'idx_payout_vendor_status' });
PayoutSchema.index({ vendorId: 1, periodStart: -1, periodEnd: -1 }, { name: 'idx_payout_vendor_period' });
PayoutSchema.index({ status: 1, createdAt: 1 }, { name: 'idx_payout_status_created' });
PayoutSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true, name: 'idx_payout_invoice' });
PayoutSchema.index({ gstInvoiceNumber: 1 }, { unique: true, sparse: true, name: 'idx_payout_gst_invoice' });

export const Payout: Model<IPayoutDocument> = mongoose.model<IPayoutDocument>('Payout', PayoutSchema);
