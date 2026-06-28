import { InvoiceModel, IInvoice } from './invoice.model';
import { BaseRepository } from '@shared/repository';

export class InvoiceRepository extends BaseRepository<IInvoice> {
  constructor() {
    super(InvoiceModel);
  }

  async findByInvoiceNumber(number: string): Promise<IInvoice | null> {
    return this.model.findOne({ invoiceNumber: number }).lean();
  }

  async findByBookingId(bookingId: string): Promise<IInvoice[]> {
    return this.model.find({ bookingId }).sort({ createdAt: -1 }).lean();
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 20): Promise<{ invoices: IInvoice[]; total: number }> {
    const [invoices, total] = await Promise.all([
      this.model.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments({ userId })
    ]);
    return { invoices, total };
  }
}
