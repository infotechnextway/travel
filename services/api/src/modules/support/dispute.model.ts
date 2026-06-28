import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected' | 'escalated';
export type DisputeType = 'refund' | 'service_quality' | 'safety' | 'billing' | 'cancellation' | 'other';

export interface IDisputeEvidence {
  _id: string;
  url: string;
  name: string;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface IDispute extends Document {
  _id: string;
  disputeNumber: string;
  bookingId: string;
  customerId: string;
  vendorId: string;
  type: DisputeType;
  status: DisputeStatus;
  subject: string;
  description: string;
  requestedRefund: number;
  approvedRefund?: number;
  evidence: IDisputeEvidence[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  ticketId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeEvidenceSchema = new Schema<IDisputeEvidence>({
  _id: { type: String, default: () => uuidv4() },
  url: { type: String, required: true },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, required: true, ref: 'User' }
}, { _id: false });

const DisputeSchema = new Schema<IDispute>(
  {
    _id: { type: String, default: () => uuidv4() },
    disputeNumber: { type: String, required: true, unique: true, index: true },
    bookingId: { type: String, required: true, ref: 'Booking', index: true },
    customerId: { type: String, required: true, ref: 'User', index: true },
    vendorId: { type: String, required: true, ref: 'Vendor', index: true },
    type: { type: String, enum: ['refund', 'service_quality', 'safety', 'billing', 'cancellation', 'other'], required: true, index: true },
    status: { type: String, enum: ['open', 'under_review', 'resolved', 'rejected', 'escalated'], default: 'open', index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    requestedRefund: { type: Number, default: 0, min: 0 },
    approvedRefund: { type: Number, min: 0 },
    evidence: { type: [DisputeEvidenceSchema], default: [] },
    resolution: { type: String, trim: true, maxlength: 5000 },
    resolvedBy: { type: String, ref: 'User' },
    resolvedAt: { type: Date },
    ticketId: { type: String, ref: 'Ticket' }
  },
  { timestamps: true }
);

DisputeSchema.index({ status: 1, createdAt: -1 });
DisputeSchema.index({ customerId: 1, status: 1 });
DisputeSchema.index({ vendorId: 1, status: 1 });

DisputeSchema.pre('save', async function (next) {
  if (this.isNew && !this.disputeNumber) {
    const date = new Date();
    const prefix = 'DSP';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.disputeNumber = `${prefix}-${year}${month}-${random}`;
  }
  next();
});

export const DisputeModel: Model<IDispute> = mongoose.model<IDispute>('Dispute', DisputeSchema);
