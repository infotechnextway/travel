import { FilterQuery, SortOrder } from 'mongoose';
import { BookingModel, IBooking } from './booking.model';
import { BaseRepository } from '@shared/repository';
import { BookingStatus } from '@shared/enums';

export class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(BookingModel);
  }

  async findByBookingCode(code: string): Promise<IBooking | null> {
    return this.model.findOne({ bookingCode: code }).populate('customerId', 'profile.name profile.email profile.phone').populate('listingId', 'title slug images').populate('vendorId', 'businessName').populate('guideId', 'bio languages').lean({ virtuals: true });
  }

  async findByCustomerId(
    customerId: string,
    filters: {
      status?: BookingStatus[];
      listingType?: string;
      startDateFrom?: Date;
      startDateTo?: Date;
      search?: string;
    },
    page: number = 1,
    limit: number = 20,
    sort: { [key: string]: SortOrder } = { createdAt: -1 }
  ): Promise<{ bookings: IBooking[]; total: number }> {
    const query: FilterQuery<IBooking> = { customerId };

    if (filters.status?.length) query.status = { $in: filters.status };
    if (filters.listingType) query['metadata.listingType'] = filters.listingType;
    if (filters.startDateFrom || filters.startDateTo) {
      query['travelDates.startDate'] = {};
      if (filters.startDateFrom) query['travelDates.startDate'].$gte = filters.startDateFrom;
      if (filters.startDateTo) query['travelDates.startDate'].$lte = filters.startDateTo;
    }
    if (filters.search) {
      query.$or = [
        { bookingCode: { $regex: filters.search, $options: 'i' } },
        { 'metadata.listingTitle': { $regex: filters.search, $options: 'i' } }
      ];
    }

    const [bookings, total] = await Promise.all([
      this.model.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean({ virtuals: true }),
      this.model.countDocuments(query)
    ]);
    return { bookings, total };
  }

  async findByVendorId(
    vendorId: string,
    filters: {
      status?: BookingStatus[];
      startDateFrom?: Date;
      startDateTo?: Date;
      search?: string;
    },
    page: number = 1,
    limit: number = 20,
    sort: { [key: string]: SortOrder } = { createdAt: -1 }
  ): Promise<{ bookings: IBooking[]; total: number }> {
    const query: FilterQuery<IBooking> = { vendorId };

    if (filters.status?.length) query.status = { $in: filters.status };
    if (filters.startDateFrom || filters.startDateTo) {
      query['travelDates.startDate'] = {};
      if (filters.startDateFrom) query['travelDates.startDate'].$gte = filters.startDateFrom;
      if (filters.startDateTo) query['travelDates.startDate'].$lte = filters.startDateTo;
    }
    if (filters.search) {
      query.$or = [
        { bookingCode: { $regex: filters.search, $options: 'i' } },
        { 'metadata.listingTitle': { $regex: filters.search, $options: 'i' } }
      ];
    }

    const [bookings, total] = await Promise.all([
      this.model.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean({ virtuals: true }),
      this.model.countDocuments(query)
    ]);
    return { bookings, total };
  }

  async findPendingReviewQueue(page: number = 1, limit: number = 50): Promise<{ bookings: IBooking[]; total: number }> {
    const query: FilterQuery<IBooking> = {
      status: BookingStatus.COMPLETED,
      reviewedAt: { $exists: false },
      'travelDates.endDate': { $lt: new Date() }
    };
    const [bookings, total] = await Promise.all([
      this.model.find(query).sort({ 'travelDates.endDate': -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { bookings, total };
  }

  async findUpcomingByCustomer(customerId: string, limit: number = 10): Promise<IBooking[]> {
    return this.model.find({
      customerId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      'travelDates.startDate': { $gte: new Date() }
    }).sort({ 'travelDates.startDate': 1 }).limit(limit).lean();
  }

  async findPastByCustomer(customerId: string, page: number = 1, limit: number = 20): Promise<{ bookings: IBooking[]; total: number }> {
    const query = {
      customerId,
      status: { $in: [BookingStatus.COMPLETED, BookingStatus.REVIEWED, BookingStatus.CANCELLED] },
      'travelDates.endDate': { $lt: new Date() }
    };
    const [bookings, total] = await Promise.all([
      this.model.find(query).sort({ 'travelDates.endDate': -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { bookings, total };
  }

  async findActiveLocks(): Promise<IBooking[]> {
    return this.model.find({
      inventoryLockExpiry: { $gte: new Date() },
      status: BookingStatus.PENDING
    }).lean();
  }

  async getBookingStats(startDate?: Date, endDate?: Date): Promise<any> {
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const [statusStats, revenueStats, dailyStats] = await Promise.all([
      this.model.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } }
      ]),
      this.model.aggregate([
        { $match: { ...match, status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.REVIEWED] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' }, totalCommission: { $sum: '$commissionAmount' }, totalVendorPayout: { $sum: '$vendorPayoutAmount' }, count: { $sum: 1 } } }
      ]),
      this.model.aggregate([
        { $match: { ...match, status: { $nin: [BookingStatus.PENDING] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, bookings: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ])
    ]);

    return { statusStats, revenueStats: revenueStats[0] || {}, dailyStats };
  }

  async getRevenueReport(startDate: Date, endDate: Date): Promise<any> {
    return this.model.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: [BookingStatus.PENDING] } } },
      {
        $group: {
          _id: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, listingType: '$metadata.listingType' },
          bookings: { $sum: 1 },
          grossRevenue: { $sum: '$totalAmount' },
          discount: { $sum: '$discountAmount' },
          netRevenue: { $sum: '$finalAmount' },
          commission: { $sum: '$commissionAmount' },
          vendorPayout: { $sum: '$vendorPayoutAmount' },
          refunds: { $sum: '$refundAmount' },
          penalties: { $sum: '$penaltyAmount' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);
  }
}
