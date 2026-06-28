import { Request, Response, NextFunction } from 'express';
import { SupportService } from './support.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class SupportController {
  constructor(private supportService: SupportService) {}

  // ─── TICKETS ───

  createTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticket = await this.supportService.createTicket(req.user.userId, req.body);
      successResponse(res, 201, ticket, 'Ticket created');
    } catch (err) { next(err); }
  };

  getTicketById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticket = await this.supportService.getTicketById(req.params.id, req.user.userId, req.user.role);
      successResponse(res, 200, ticket, 'Ticket retrieved');
    } catch (err) { next(err); }
  };

  getMyTickets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        category: req.query.category as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.supportService.getMyTickets(req.user.userId, filters);
      successResponse(res, 200, result.tickets, 'Tickets retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  addMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticket = await this.supportService.addMessage(req.params.id, req.user.userId, req.user.role, req.body);
      successResponse(res, 200, ticket, 'Message added');
    } catch (err) { next(err); }
  };

  updateTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticket = await this.supportService.updateTicket(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, ticket, 'Ticket updated');
    } catch (err) { next(err); }
  };

  escalateTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticket = await this.supportService.escalateTicket(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, ticket, 'Ticket escalated');
    } catch (err) { next(err); }
  };

  rateTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticket = await this.supportService.rateTicket(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, ticket, 'Ticket rated');
    } catch (err) { next(err); }
  };

  closeTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticket = await this.supportService.closeTicket(req.params.id, req.user.userId);
      successResponse(res, 200, ticket, 'Ticket closed');
    } catch (err) { next(err); }
  };

  // ─── ADMIN TICKETS ───

  searchTickets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        category: req.query.category as string,
        assignedTo: req.query.assignedTo as string,
        slaBreached: req.query.slaBreached === 'true' ? true : req.query.slaBreached === 'false' ? false : undefined,
        search: req.query.search as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.supportService.searchTickets(filters);
      successResponse(res, 200, result.tickets, 'Tickets retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  getMyAssignedTickets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.supportService.getMyAssignedTickets(req.user.userId, filters);
      successResponse(res, 200, result.tickets, 'Assigned tickets retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  getTicketStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.supportService.getTicketStats();
      successResponse(res, 200, stats, 'Ticket statistics');
    } catch (err) { next(err); }
  };

  checkSlaBreaches = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.supportService.checkSlaBreaches();
      successResponse(res, 200, result, 'SLA breach check completed');
    } catch (err) { next(err); }
  };

  // ─── FAQ / HELP CENTER ───

  createFaq = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const faq = await this.supportService.createFaq(req.body);
      successResponse(res, 201, faq, 'FAQ created');
    } catch (err) { next(err); }
  };

  updateFaq = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const faq = await this.supportService.updateFaq(req.params.id, req.body);
      successResponse(res, 200, faq, 'FAQ updated');
    } catch (err) { next(err); }
  };

  deleteFaq = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.supportService.deleteFaq(req.params.id);
      successResponse(res, 200, null, 'FAQ deleted');
    } catch (err) { next(err); }
  };

  getPublishedFaqs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const faqs = await this.supportService.getPublishedFaqs(req.query.category as string);
      successResponse(res, 200, faqs, 'FAQs retrieved');
    } catch (err) { next(err); }
  };

  getFaqById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const faq = await this.supportService.getFaqById(req.params.id);
      successResponse(res, 200, faq, 'FAQ retrieved');
    } catch (err) { next(err); }
  };

  searchFaqs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const faqs = await this.supportService.searchFaqs(req.query.q as string);
      successResponse(res, 200, faqs, 'FAQs searched');
    } catch (err) { next(err); }
  };

  voteFaq = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.supportService.voteFaq(req.params.id, req.body.isHelpful);
      successResponse(res, 200, null, 'Vote recorded');
    } catch (err) { next(err); }
  };

  // ─── DISPUTES ───

  createDispute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dispute = await this.supportService.createDispute(req.user.userId, req.body);
      successResponse(res, 201, dispute, 'Dispute created');
    } catch (err) { next(err); }
  };

  getDisputeById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dispute = await this.supportService.getDisputeById(req.params.id, req.user.userId, req.user.role);
      successResponse(res, 200, dispute, 'Dispute retrieved');
    } catch (err) { next(err); }
  };

  getMyDisputes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        type: req.query.type as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.supportService.getMyDisputes(req.user.userId, filters);
      successResponse(res, 200, result.disputes, 'Disputes retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  addDisputeEvidence = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dispute = await this.supportService.addDisputeEvidence(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, dispute, 'Evidence added');
    } catch (err) { next(err); }
  };

  resolveDispute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dispute = await this.supportService.resolveDispute(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, dispute, 'Dispute resolved');
    } catch (err) { next(err); }
  };

  searchDisputes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        type: req.query.type as string,
        customerId: req.query.customerId as string,
        vendorId: req.query.vendorId as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.supportService.searchDisputes(filters);
      successResponse(res, 200, result.disputes, 'Disputes retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  getDisputeStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.supportService.getDisputeStats();
      successResponse(res, 200, stats, 'Dispute statistics');
    } catch (err) { next(err); }
  };
}
