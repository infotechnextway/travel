import { TicketRepository, FaqRepository, DisputeRepository } from './support.repository';
import { ITicket, ITicketMessage } from './support-ticket.model';
import { IFaq } from './faq.model';
import { IDispute, IDisputeEvidence } from './dispute.model';
import { BookingRepository } from '@modules/bookings/booking.repository';
import { AppError, NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import { UserRole } from '@shared/enums';

const SLA_HOURS: Record<string, number> = {
  low: 48,
  medium: 24,
  high: 8,
  urgent: 2
};

export class SupportService {
  constructor(
    private ticketRepo: TicketRepository,
    private faqRepo: FaqRepository,
    private disputeRepo: DisputeRepository,
    private bookingRepo: BookingRepository
  ) {}

  // ─── TICKETS ───

  async createTicket(userId: string, dto: any): Promise<ITicket> {
    const slaHours = SLA_HOURS[dto.priority] || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticket = await this.ticketRepo.create({
      userId,
      category: dto.category,
      priority: dto.priority,
      subject: dto.subject,
      description: dto.description,
      bookingId: dto.bookingId,
      listingId: dto.listingId,
      vendorId: dto.vendorId,
      slaDeadline,
      slaBreached: false,
      status: 'open',
      messages: [{
        _id: '',
        senderId: userId,
        senderRole: 'customer',
        content: dto.description,
        isInternal: false,
        createdAt: new Date()
      }]
    } as any);

    return ticket;
  }

  async getTicketById(ticketId: string, userId: string, userRole: UserRole): Promise<ITicket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.isDeleted) throw new NotFoundError('Ticket not found');

    const isOwner = ticket.userId === userId;
    const isAssigned = ticket.assignedTo === userId;
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole);

    if (!isOwner && !isAssigned && !isAdmin) throw new ForbiddenError('Access denied');

    return ticket;
  }

  async getMyTickets(userId: string, filters: any): Promise<{ tickets: ITicket[]; total: number }> {
    return this.ticketRepo.findByUserId(userId, filters, filters.page, filters.limit);
  }

  async addMessage(ticketId: string, userId: string, userRole: UserRole, dto: any): Promise<ITicket> {
    const ticket = await this.getTicketById(ticketId, userId, userRole);
    if (ticket.status === 'closed') throw new ConflictError('Cannot add message to closed ticket');

    const message: ITicketMessage = {
      _id: '',
      senderId: userId,
      senderRole: this.mapRole(userRole),
      content: dto.content,
      attachments: dto.attachments || [],
      isInternal: dto.isInternal || false,
      createdAt: new Date()
    };

    // If customer replies while status is waiting_customer, move back to in_progress
    const updates: any = { $push: { messages: message } };
    if (ticket.status === 'waiting_customer' && message.senderRole === 'customer') {
      updates.status = 'in_progress';
    }

    return this.ticketRepo.update(ticketId, updates) as Promise<ITicket>;
  }

  async updateTicket(ticketId: string, adminId: string, dto: any): Promise<ITicket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.isDeleted) throw new NotFoundError('Ticket not found');

    const updates: any = {};
    if (dto.status) updates.status = dto.status;
    if (dto.priority) {
      updates.priority = dto.priority;
      // Recalculate SLA
      const slaHours = SLA_HOURS[dto.priority] || 24;
      updates.slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);
      updates.slaBreached = false;
    }
    if (dto.assignedTo) updates.assignedTo = dto.assignedTo;
    if (dto.resolution) updates.resolution = dto.resolution;
    if (dto.tags) updates.tags = dto.tags;

    if (dto.status === 'resolved') {
      updates.resolution = dto.resolution || ticket.resolution || 'Resolved by support team';
    }
    if (dto.status === 'closed') {
      if (ticket.status !== 'resolved') throw new ConflictError('Can only close resolved tickets');
    }

    return this.ticketRepo.update(ticketId, updates) as Promise<ITicket>;
  }

  async escalateTicket(ticketId: string, adminId: string, dto: any): Promise<ITicket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');

    return this.ticketRepo.update(ticketId, {
      status: 'escalated',
      escalatedAt: new Date(),
      escalatedTo: dto.escalatedTo,
      escalatedReason: dto.reason,
      assignedTo: dto.escalatedTo
    }) as Promise<ITicket>;
  }

  async rateTicket(ticketId: string, userId: string, dto: any): Promise<ITicket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.userId !== userId) throw new ForbiddenError('Not your ticket');
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') throw new ConflictError('Can only rate resolved tickets');
    if (ticket.satisfactionRating) throw new ConflictError('Already rated');

    return this.ticketRepo.update(ticketId, {
      satisfactionRating: dto.rating,
      satisfactionComment: dto.comment
    }) as Promise<ITicket>;
  }

  async closeTicket(ticketId: string, adminId: string): Promise<ITicket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.status !== 'resolved') throw new ConflictError('Can only close resolved tickets');

    return this.ticketRepo.update(ticketId, { status: 'closed' }) as Promise<ITicket>;
  }

  async searchTickets(filters: any): Promise<{ tickets: ITicket[]; total: number }> {
    return this.ticketRepo.searchTickets(filters, filters.page, filters.limit);
  }

  async getMyAssignedTickets(adminId: string, filters: any): Promise<{ tickets: ITicket[]; total: number }> {
    return this.ticketRepo.findAssignedTo(adminId, filters, filters.page, filters.limit);
  }

  async getTicketStats(): Promise<any> {
    return this.ticketRepo.getTicketStats();
  }

  async checkSlaBreaches(): Promise<{ breached: number; tickets: ITicket[] }> {
    const tickets = await this.ticketRepo.getSlaBreachedTickets();
    for (const ticket of tickets) {
      await this.ticketRepo.update(ticket._id, { slaBreached: true });
    }
    return { breached: tickets.length, tickets };
  }

  // ─── FAQ / HELP CENTER ───

  async createFaq(dto: any): Promise<IFaq> {
    return this.faqRepo.create(dto as any);
  }

  async updateFaq(faqId: string, dto: any): Promise<IFaq> {
    return this.faqRepo.update(faqId, dto) as Promise<IFaq>;
  }

  async deleteFaq(faqId: string): Promise<void> {
    await this.faqRepo.delete(faqId);
  }

  async getPublishedFaqs(category?: string): Promise<IFaq[]> {
    return this.faqRepo.findPublished(category);
  }

  async getFaqById(faqId: string): Promise<IFaq> {
    const faq = await this.faqRepo.findById(faqId);
    if (!faq) throw new NotFoundError('FAQ not found');
    await this.faqRepo.incrementViewCount(faqId);
    return faq;
  }

  async searchFaqs(query: string): Promise<IFaq[]> {
    return this.faqRepo.searchFaqs(query);
  }

  async voteFaq(faqId: string, isHelpful: boolean): Promise<void> {
    const faq = await this.faqRepo.findById(faqId);
    if (!faq) throw new NotFoundError('FAQ not found');
    await this.faqRepo.voteHelpful(faqId, isHelpful);
  }

  // ─── DISPUTES ───

  async createDispute(customerId: string, dto: any): Promise<IDispute> {
    const booking = await this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');

    const existing = await this.disputeRepo.findByBookingId(dto.bookingId);
    const openDispute = existing.find(d => ['open', 'under_review', 'escalated'].includes(d.status));
    if (openDispute) throw new ConflictError('An open dispute already exists for this booking');

    const evidence: IDisputeEvidence[] = (dto.evidence || []).map((e: any) => ({
      _id: '',
      ...e,
      uploadedAt: new Date(),
      uploadedBy: customerId
    }));

    const dispute = await this.disputeRepo.create({
      bookingId: dto.bookingId,
      customerId,
      vendorId: booking.vendorId,
      type: dto.type,
      subject: dto.subject,
      description: dto.description,
      requestedRefund: dto.requestedRefund,
      evidence
    } as any);

    // Auto-create support ticket for dispute
    await this.ticketRepo.create({
      userId: customerId,
      category: 'dispute',
      priority: 'high',
      subject: `Dispute: ${dto.subject}`,
      description: dto.description,
      bookingId: dto.bookingId,
      vendorId: booking.vendorId,
      slaDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours for disputes
      slaBreached: false,
      status: 'open',
      messages: []
    } as any);

    return dispute;
  }

  async getDisputeById(disputeId: string, userId: string, userRole: UserRole): Promise<IDispute> {
    const dispute = await this.disputeRepo.findById(disputeId);
    if (!dispute) throw new NotFoundError('Dispute not found');

    const isOwner = dispute.customerId === userId;
    const isVendor = dispute.vendorId === userId;
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole);

    if (!isOwner && !isVendor && !isAdmin) throw new ForbiddenError('Access denied');

    return dispute;
  }

  async getMyDisputes(customerId: string, filters: any): Promise<{ disputes: IDispute[]; total: number }> {
    return this.disputeRepo.findByCustomerId(customerId, filters, filters.page, filters.limit);
  }

  async addDisputeEvidence(disputeId: string, userId: string, evidence: any): Promise<IDispute> {
    const dispute = await this.disputeRepo.findById(disputeId);
    if (!dispute) throw new NotFoundError('Dispute not found');
    if (dispute.customerId !== userId) throw new ForbiddenError('Not your dispute');
    if (!['open', 'under_review'].includes(dispute.status)) throw new ConflictError('Cannot add evidence to resolved dispute');

    const newEvidence: IDisputeEvidence = {
      _id: '',
      ...evidence,
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    return this.disputeRepo.update(disputeId, { $push: { evidence: newEvidence } }) as Promise<IDispute>;
  }

  async resolveDispute(disputeId: string, adminId: string, dto: any): Promise<IDispute> {
    const dispute = await this.disputeRepo.findById(disputeId);
    if (!dispute) throw new NotFoundError('Dispute not found');
    if (!['open', 'under_review', 'escalated'].includes(dispute.status)) throw new ConflictError('Dispute already resolved');

    const updates: any = {
      status: dto.status,
      resolution: dto.resolution,
      resolvedBy: adminId,
      resolvedAt: new Date()
    };
    if (dto.approvedRefund !== undefined) updates.approvedRefund = dto.approvedRefund;

    return this.disputeRepo.update(disputeId, updates) as Promise<IDispute>;
  }

  async searchDisputes(filters: any): Promise<{ disputes: IDispute[]; total: number }> {
    return this.disputeRepo.searchDisputes(filters, filters.page, filters.limit);
  }

  async getDisputeStats(): Promise<any> {
    return this.disputeRepo.getDisputeStats();
  }

  // ─── HELPERS ───

  private mapRole(userRole: UserRole): ITicketMessage['senderRole'] {
    switch (userRole) {
      case UserRole.VENDOR: return 'vendor';
      case UserRole.GUIDE: return 'guide';
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN: return 'admin';
      default: return 'customer';
    }
  }
}
