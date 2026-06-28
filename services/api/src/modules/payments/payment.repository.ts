import { FilterQuery, SortOrder } from 'mongoose';
import { PaymentModel, IPayment } from './payment.model';
import { BaseRepository } from '@shared/repository';
import { PaymentStatus } from '@shared/enums';

export class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
    super(PaymentModel);
  }

  async findByGatewayOrderId(orderId: string): Promise<IPayment | null> {
    return this.model.findOne({ gatewayOrderId: orderId }).lean();
  }

  async findByGatewayPaymentId(paymentId: string): Promise<IPayment | null> {
    return this.model.findOne({ gatewayPaymentId: paymentId }).lean();
  }

  async findByBookingId(bookingId: string): Promise<IPayment[]> {
    return this.model.find({ bookingId }).sort({ createdAt: -1 }).lean();
  }

  async findByUserId(
    userId: string,
    filters: {
      status?: PaymentStatus[];
      gateway?: string[];
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ payments: IPayment[]; total: number }> {
    const query: FilterQuery<IPayment> = { userId };
    if (filters.status?.length) query.status = { $in: filters.status };
    if (filters.gateway?.length) query.gateway = { $in: filters.gateway };
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const [payments, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { payments, total };
  }

  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<any> {
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const [gatewayStats, statusStats, dailyRevenue] = await Promise.all([
      this.model.aggregate([
        { $match: { ...match, status: PaymentStatus.COMPLETED } },
        { $group: { _id: '$gateway', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      this.model.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
      ]),
      this.model.aggregate([
        { $match: { ...match, status: PaymentStatus.COMPLETED } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ])
    ]);

    return { gatewayStats, statusStats, dailyRevenue };
  }

  async getPendingRefunds(): Promise<IPayment[]> {
    return this.model.find({ refundStatus: 'pending' }).sort({ createdAt: 1 }).lean();
  }
}
