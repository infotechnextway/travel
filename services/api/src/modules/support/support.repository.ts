import { FilterQuery, SortOrder } from 'mongoose';
import { TicketModel, ITicket } from './support-ticket.model';
import { FaqModel, IFaq } from './faq.model';
import { DisputeModel, IDispute } from './dispute.model';
import { BaseRepository } from '@shared/repository';

export class TicketRepository extends BaseRepository<ITicket> {
  constructor() {
    super(TicketModel);
  }

  async findByTicketNumber(number: string): Promise<ITicket | null> {
    return this.model.findOne({ ticketNumber: number }).lean();
  }

  async findByUserId(
    userId: string,
    filters: { status?: string; category?: string },
    page: number = 1,
    limit: number = 20
  ): Promise<{ tickets: ITicket[]; total: number }> {
    const query: FilterQuery<ITicket> = { userId, isDeleted: false };
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;

    const [tickets, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { tickets, total };
  }

  async findAssignedTo(
    adminId: string,
    filters: { status?: string; priority?: string },
    page: number = 1,
    limit: number = 20
  ): Promise<{ tickets: ITicket[]; total: number }> {
    const query: FilterQuery<ITicket> = { assignedTo: adminId, isDeleted: false };
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;

    const [tickets, total] = await Promise.all([
      this.model.find(query).sort({ slaDeadline: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { tickets, total };
  }

  async searchTickets(
    filters: {
      status?: string;
      priority?: string;
      category?: string;
      assignedTo?: string;
      search?: string;
      slaBreached?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ tickets: ITicket[]; total: number }> {
    const query: FilterQuery<ITicket> = { isDeleted: false };
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.slaBreached !== undefined) query.slaBreached = filters.slaBreached;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }
    if (filters.search) {
      query.$or = [
        { ticketNumber: { $regex: filters.search, $options: 'i' } },
        { subject: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { tickets, total };
  }

  async getSlaBreachedTickets(): Promise<ITicket[]> {
    return this.model.find({
      slaDeadline: { $lt: new Date() },
      slaBreached: false,
      status: { $nin: ['resolved', 'closed'] },
      isDeleted: false
    }).lean();
  }

  async getTicketStats(): Promise<any> {
    const [byStatus, byCategory, byPriority, slaBreached, avgResolutionTime] = await Promise.all([
      this.model.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.model.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      this.model.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      this.model.countDocuments({ slaBreached: true, isDeleted: false }),
      this.model.aggregate([
        { $match: { status: 'resolved', resolvedAt: { $exists: true }, createdAt: { $exists: true } } },
        { $project: { resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] } } },
        { $group: { _id: null, avg: { $avg: '$resolutionTime' } } }
      ])
    ]);

    return {
      byStatus: byStatus.reduce((a: any, s: any) => ({ ...a, [s._id]: s.count }), {}),
      byCategory: byCategory.reduce((a: any, s: any) => ({ ...a, [s._id]: s.count }), {}),
      byPriority: byPriority.reduce((a: any, s: any) => ({ ...a, [s._id]: s.count }), {}),
      slaBreached,
      avgResolutionTimeMs: avgResolutionTime[0]?.avg || 0
    };
  }
}

export class FaqRepository extends BaseRepository<IFaq> {
  constructor() {
    super(FaqModel);
  }

  async findPublished(category?: string): Promise<IFaq[]> {
    const query: FilterQuery<IFaq> = { isPublished: true };
    if (category) query.category = category;
    return this.model.find(query).sort({ order: 1, createdAt: -1 }).lean();
  }

  async searchFaqs(query: string): Promise<IFaq[]> {
    return this.model.find({
      isPublished: true,
      $or: [
        { question: { $regex: query, $options: 'i' } },
        { answer: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    }).sort({ order: 1 }).limit(20).lean();
  }

  async incrementViewCount(faqId: string): Promise<void> {
    await this.model.updateOne({ _id: faqId }, { $inc: { viewCount: 1 } });
  }

  async voteHelpful(faqId: string, isHelpful: boolean): Promise<void> {
    const field = isHelpful ? 'helpfulCount' : 'notHelpfulCount';
    await this.model.updateOne({ _id: faqId }, { $inc: { [field]: 1 } });
  }
}

export class DisputeRepository extends BaseRepository<IDispute> {
  constructor() {
    super(DisputeModel);
  }

  async findByDisputeNumber(number: string): Promise<IDispute | null> {
    return this.model.findOne({ disputeNumber: number }).lean();
  }

  async findByBookingId(bookingId: string): Promise<IDispute[]> {
    return this.model.find({ bookingId }).sort({ createdAt: -1 }).lean();
  }

  async findByCustomerId(
    customerId: string,
    filters: { status?: string; type?: string },
    page: number = 1,
    limit: number = 20
  ): Promise<{ disputes: IDispute[]; total: number }> {
    const query: FilterQuery<IDispute> = { customerId };
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    const [disputes, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { disputes, total };
  }

  async searchDisputes(
    filters: {
      status?: string;
      type?: string;
      customerId?: string;
      vendorId?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ disputes: IDispute[]; total: number }> {
    const query: FilterQuery<IDispute> = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.vendorId) query.vendorId = filters.vendorId;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }
    if (filters.search) {
      query.$or = [
        { disputeNumber: { $regex: filters.search, $options: 'i' } },
        { subject: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const [disputes, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { disputes, total };
  }

  async getDisputeStats(): Promise<any> {
    const [byStatus, byType, totalOpen, totalResolved] = await Promise.all([
      this.model.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.model.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      this.model.countDocuments({ status: { $in: ['open', 'under_review', 'escalated'] } }),
      this.model.countDocuments({ status: 'resolved' })
    ]);

    return {
      byStatus: byStatus.reduce((a: any, s: any) => ({ ...a, [s._id]: s.count }), {}),
      byType: byType.reduce((a: any, s: any) => ({ ...a, [s._id]: s.count }), {}),
      totalOpen,
      totalResolved
    };
  }
}
