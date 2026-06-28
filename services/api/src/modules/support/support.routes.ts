import { Router } from 'express';
import { SupportController } from './support.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  CreateTicketDto, AddMessageDto, UpdateTicketDto, EscalateTicketDto, RateTicketDto,
  TicketSearchDto, AdminTicketSearchDto, CreateFaqDto, UpdateFaqDto,
  CreateDisputeDto, ResolveDisputeDto, DisputeSearchDto
} from './support.dto';
import { Permission } from '@shared/enums';

export const createSupportRoutes = (controller: SupportController): Router => {
  const router = Router();

  // ─── CUSTOMER TICKETS ───
  router.post('/tickets', authenticate, validate(CreateTicketDto), controller.createTicket);
  router.get('/tickets/my', authenticate, validateQuery(TicketSearchDto), controller.getMyTickets);
  router.get('/tickets/:id', authenticate, controller.getTicketById);
  router.post('/tickets/:id/messages', authenticate, validate(AddMessageDto), controller.addMessage);
  router.post('/tickets/:id/rate', authenticate, validate(RateTicketDto), controller.rateTicket);

  // ─── ADMIN TICKETS ───
  router.patch('/tickets/:id', authenticate, authorize(Permission.MANAGE_SUPPORT), validate(UpdateTicketDto), controller.updateTicket);
  router.post('/tickets/:id/escalate', authenticate, authorize(Permission.MANAGE_SUPPORT), validate(EscalateTicketDto), controller.escalateTicket);
  router.post('/tickets/:id/close', authenticate, authorize(Permission.MANAGE_SUPPORT), controller.closeTicket);
  router.get('/tickets/admin/search', authenticate, authorize(Permission.MANAGE_SUPPORT), validateQuery(AdminTicketSearchDto), controller.searchTickets);
  router.get('/tickets/admin/assigned', authenticate, authorize(Permission.MANAGE_SUPPORT), validateQuery(AdminTicketSearchDto), controller.getMyAssignedTickets);
  router.get('/tickets/admin/stats', authenticate, authorize(Permission.MANAGE_SUPPORT), controller.getTicketStats);
  router.post('/tickets/admin/check-sla', authenticate, authorize(Permission.MANAGE_SUPPORT), controller.checkSlaBreaches);

  // ─── FAQ / HELP CENTER (Public + Admin) ───
  router.get('/faq', controller.getPublishedFaqs);
  router.get('/faq/search', controller.searchFaqs);
  router.get('/faq/:id', controller.getFaqById);
  router.post('/faq/:id/vote', controller.voteFaq);
  router.post('/faq/admin', authenticate, authorize(Permission.MANAGE_CMS), validate(CreateFaqDto), controller.createFaq);
  router.patch('/faq/admin/:id', authenticate, authorize(Permission.MANAGE_CMS), validate(UpdateFaqDto), controller.updateFaq);
  router.delete('/faq/admin/:id', authenticate, authorize(Permission.MANAGE_CMS), controller.deleteFaq);

  // ─── DISPUTES ───
  router.post('/disputes', authenticate, validate(CreateDisputeDto), controller.createDispute);
  router.get('/disputes/my', authenticate, validateQuery(DisputeSearchDto), controller.getMyDisputes);
  router.get('/disputes/:id', authenticate, controller.getDisputeById);
  router.post('/disputes/:id/evidence', authenticate, controller.addDisputeEvidence);
  router.post('/disputes/:id/resolve', authenticate, authorize(Permission.MANAGE_SUPPORT), validate(ResolveDisputeDto), controller.resolveDispute);
  router.get('/disputes/admin/search', authenticate, authorize(Permission.MANAGE_SUPPORT), validateQuery(DisputeSearchDto), controller.searchDisputes);
  router.get('/disputes/admin/stats', authenticate, authorize(Permission.MANAGE_SUPPORT), controller.getDisputeStats);

  return router;
};
