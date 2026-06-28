import Joi from 'joi';

export const CreateTicketDto = Joi.object({
  category: Joi.string().valid('booking', 'payment', 'refund', 'listing', 'guide', 'technical', 'account', 'general', 'dispute').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  subject: Joi.string().trim().min(5).max(200).required(),
  description: Joi.string().trim().min(20).max(5000).required(),
  bookingId: Joi.string().uuid().optional(),
  listingId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional()
});

export const AddMessageDto = Joi.object({
  content: Joi.string().trim().min(1).max(10000).required(),
  attachments: Joi.array().items(Joi.object({
    url: Joi.string().uri().required(),
    name: Joi.string().trim().max(200).required(),
    mimeType: Joi.string().trim().max(100).required()
  })).max(5).optional(),
  isInternal: Joi.boolean().default(false)
});

export const UpdateTicketDto = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'escalated').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  assignedTo: Joi.string().uuid().optional(),
  resolution: Joi.string().trim().max(5000).optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional()
}).min(1);

export const EscalateTicketDto = Joi.object({
  reason: Joi.string().trim().min(10).max(500).required(),
  escalatedTo: Joi.string().uuid().required()
});

export const RateTicketDto = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).optional()
});

export const TicketSearchDto = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'escalated').optional(),
  category: Joi.string().valid('booking', 'payment', 'refund', 'listing', 'guide', 'technical', 'account', 'general', 'dispute').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  search: Joi.string().trim().max(200).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const AdminTicketSearchDto = Joi.object({
  status: Joi.string().optional(),
  priority: Joi.string().optional(),
  category: Joi.string().optional(),
  assignedTo: Joi.string().uuid().optional(),
  slaBreached: Joi.boolean().optional(),
  search: Joi.string().trim().max(200).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const CreateFaqDto = Joi.object({
  question: Joi.string().trim().min(10).max(500).required(),
  answer: Joi.string().trim().min(20).max(10000).required(),
  category: Joi.string().trim().min(2).max(100).required(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
  order: Joi.number().integer().min(0).default(0)
});

export const UpdateFaqDto = Joi.object({
  question: Joi.string().trim().min(10).max(500).optional(),
  answer: Joi.string().trim().min(20).max(10000).optional(),
  category: Joi.string().trim().min(2).max(100).optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
  order: Joi.number().integer().min(0).optional(),
  isPublished: Joi.boolean().optional()
}).min(1);

export const CreateDisputeDto = Joi.object({
  bookingId: Joi.string().uuid().required(),
  type: Joi.string().valid('refund', 'service_quality', 'safety', 'billing', 'cancellation', 'other').required(),
  subject: Joi.string().trim().min(5).max(200).required(),
  description: Joi.string().trim().min(20).max(5000).required(),
  requestedRefund: Joi.number().min(0).default(0),
  evidence: Joi.array().items(Joi.object({
    url: Joi.string().uri().required(),
    name: Joi.string().trim().max(200).required(),
    mimeType: Joi.string().trim().max(100).required()
  })).max(10).optional()
});

export const ResolveDisputeDto = Joi.object({
  status: Joi.string().valid('resolved', 'rejected').required(),
  resolution: Joi.string().trim().min(10).max(5000).required(),
  approvedRefund: Joi.number().min(0).optional()
});

export const DisputeSearchDto = Joi.object({
  status: Joi.string().valid('open', 'under_review', 'resolved', 'rejected', 'escalated').optional(),
  type: Joi.string().valid('refund', 'service_quality', 'safety', 'billing', 'cancellation', 'other').optional(),
  customerId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().optional(),
  search: Joi.string().trim().max(200).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
