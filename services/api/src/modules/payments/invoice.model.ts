import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Currency } from '@shared/enums';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  hsnCode?: string;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface IInvoice extends Document {
  _id: string;
  invoiceNumber: string;
  bookingId: string;
  userId: string;
  vendorId?: string;
  type: 'customer' | 'vendor' | 'commission';
  items: IInvoiceItem[];
  subtotal: number;
  totalTax: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalAmount: number;
  currency: Currency;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issuedAt?: Date;
  paidAt?: Date;
  gstin?: string;
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  pdfUrl?: string;
  eInvoiceStatus?: 'pending' | 'generated' | 'failed';
  eInvoiceIrn?: string;
  eInvoiceQr?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  hsnCode: { type: String },
  taxRate: { type: Number, required: true, min: 0 },
  cgst: { type: Number, required: true, min: 0 },
  sgst: { type: Number, required: true, min: 0 },
  igst: { type: Number, required: true, min: 0 }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>(
  {
    _id: { type: String, default: () => uuidv4() },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    bookingId: { type: String, required: true, ref: 'Booking', index: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    vendorId: { type: String, ref: 'Vendor' },
    type: { type: String, enum: ['customer', 'vendor', 'commission'], required: true },
    items: { type: [InvoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    totalTax: { type: Number, required: true, min: 0 },
    cgstTotal: { type: Number, required: true, min: 0 },
    sgstTotal: { type: Number, required: true, min: 0 },
    igstTotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: Object.values(Currency), default: Currency.INR },
    status: { type: String, enum: ['draft', 'issued', 'paid', 'cancelled'], default: 'draft' },
    issuedAt: { type: Date },
    paidAt: { type: Date },
    gstin: { type: String },
    billingAddress: {
      name: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: 'India' }
    },
    pdfUrl: { type: String },
    eInvoiceStatus: { type: String, enum: ['pending', 'generated', 'failed'] },
    eInvoiceIrn: { type: String },
    eInvoiceQr: { type: String }
  },
  { timestamps: true }
);

// Pre-save hook to generate invoice number
InvoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const date = new Date();
    const prefix = 'INV';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.invoiceNumber = `${prefix}-${year}${month}-${random}`;
  }
  next();
});

export const InvoiceModel: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
