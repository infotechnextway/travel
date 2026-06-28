import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed' | 'escalated';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'booking' | 'payment' | 'refund' | 'listing' | 'guide' | 'technical' | 'account' | 'general' | 'dispute';

export interface ITicketMessage {
  _id: string;
  senderId: string;
  senderRole: 'customer' | 'vendor' | 'guide' | 'admin' | 'system';
  content: string;
  attachments?: { url: string; name: string; mimeType: string }[];
  isInternal: boolean;
  createdAt: Date;
}

export interface ITicket extends Document {
  _id: string;
  ticketNumber: string;
  userId: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  bookingId?: string;
  listingId?: string;
  vendorId?: string;
  assignedTo?: string;
  messages: ITicketMessage[];
  resolution?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
  slaDeadline: Date;
  slaBreached: boolean;
  escalatedAt?: Date;
  escalatedTo?: string;
  escalatedReason?: string;
  tags?: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>({
  _id: { type: String, default: () => uuidv4() },
  senderId: { type: String, required: true, ref: 'User' },
  senderRole: { type: String, enum: ['customer', 'vendor', 'guide', 'admin', 'system'], required: true },
  content: { type: String, required: true, trim: true, maxlength: 10000 },
  attachments: [{
    url: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true }
  }],
  isInternal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const TicketSchema = new Schema<ITicket>(
  {
    _id: { type: String, default: () => uuidv4() },
    ticketNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    category: { type: String, enum: ['booking', 'payment', 'refund', 'listing', 'guide', 'technical', 'account', 'general', 'dispute'], required: true, index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    status: { type: String, enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'escalated'], default: 'open', index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    bookingId: { type: String, ref: 'Booking', index: true },
    listingId: { type: String, ref: 'Listing' },
    vendorId: { type: String, ref: 'Vendor' },
    assignedTo: { type: String, ref: 'User', index: true },
    messages: { type: [TicketMessageSchema], default: [] },
    resolution: { type: String, trim: true, maxlength: 5000 },
    satisfactionRating: { type: Number, min: 1, max: 5 },
    satisfactionComment: { type: String, trim: true, maxlength: 1000 },
    slaDeadline: { type: Date, required: true, index: true },
    slaBreached: { type: Boolean, default: false, index: true },
    escalatedAt: { type: Date },
    escalatedTo: { type: String, ref: 'User' },
    escalatedReason: { type: String, trim: true, maxlength: 500 },
    tags: [{ type: String, trim: true }],
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// Compound indexes
TicketSchema.index({ status: 1, priority: 1, slaDeadline: 1 });
TicketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
TicketSchema.index({ userId: 1, status: 1, createdAt: -1 });
TicketSchema.index({ category: 1, status: 1 });
TicketSchema.index({ slaBreached: 1, status: 1 });

// Pre-save hook to generate ticket number
TicketSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    const date = new Date();
    const prefix = 'TKT';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ticketNumber = `${prefix}-${year}${month}-${random}`;
  }
  next();
});

export const TicketModel: Model<ITicket> = mongoose.model<ITicket>('Ticket', TicketSchema);
