import Joi from 'joi';

export const SendNotificationDto = Joi.object({
  userId: Joi.string().uuid().required(),
  type: Joi.string().trim().min(3).max(50).required(),
  topic: Joi.string().valid('booking', 'payment', 'promo', 'trip', 'system', 'support', 'review', 'vendor', 'guide').required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  title: Joi.string().trim().min(5).max(200).required(),
  body: Joi.string().trim().min(10).max(2000).required(),
  data: Joi.object().optional(),
  imageUrl: Joi.string().uri().optional(),
  actionUrl: Joi.string().uri().optional(),
  channels: Joi.array().items(Joi.string().valid('push', 'email', 'whatsapp', 'inapp')).min(1).optional(),
  expiresAt: Joi.date().iso().greater('now').optional()
});

export const BulkSendNotificationDto = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).min(1).max(1000).required(),
  type: Joi.string().trim().min(3).max(50).required(),
  topic: Joi.string().valid('booking', 'payment', 'promo', 'trip', 'system', 'support', 'review', 'vendor', 'guide').required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  title: Joi.string().trim().min(5).max(200).required(),
  body: Joi.string().trim().min(10).max(2000).required(),
  data: Joi.object().optional(),
  imageUrl: Joi.string().uri().optional(),
  actionUrl: Joi.string().uri().optional(),
  channels: Joi.array().items(Joi.string().valid('push', 'email', 'whatsapp', 'inapp')).min(1).optional()
});

export const UpdatePreferencesDto = Joi.object({
  channels: Joi.object({
    push: Joi.object({ enabled: Joi.boolean().optional(), quietHoursStart: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), quietHoursEnd: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional() }).optional(),
    email: Joi.object({ enabled: Joi.boolean().optional(), quietHoursStart: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), quietHoursEnd: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional() }).optional(),
    whatsapp: Joi.object({ enabled: Joi.boolean().optional(), quietHoursStart: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), quietHoursEnd: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional() }).optional(),
    inapp: Joi.object({ enabled: Joi.boolean().optional(), quietHoursStart: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), quietHoursEnd: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional() }).optional()
  }).optional(),
  topics: Joi.object({
    booking: Joi.boolean().optional(),
    payment: Joi.boolean().optional(),
    promo: Joi.boolean().optional(),
    trip: Joi.boolean().optional(),
    system: Joi.boolean().optional(),
    support: Joi.boolean().optional(),
    review: Joi.boolean().optional(),
    vendor: Joi.boolean().optional(),
    guide: Joi.boolean().optional()
  }).optional(),
  digestEmail: Joi.boolean().optional(),
  digestFrequency: Joi.string().valid('daily', 'weekly', 'never').optional(),
  marketingOptIn: Joi.boolean().optional()
}).min(1);

export const MarkReadDto = Joi.object({
  notificationIds: Joi.array().items(Joi.string().uuid()).min(1).required()
});

export const NotificationSearchDto = Joi.object({
  isRead: Joi.boolean().optional(),
  topic: Joi.string().valid('booking', 'payment', 'promo', 'trip', 'system', 'support', 'review', 'vendor', 'guide').optional(),
  status: Joi.string().valid('pending', 'partial', 'delivered', 'failed').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

export const CreateTemplateDto = Joi.object({
  code: Joi.string().trim().min(3).max(50).required(),
  name: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().max(500).optional(),
  channels: Joi.array().items(Joi.string().valid('push', 'email', 'whatsapp', 'inapp')).min(1).required(),
  topic: Joi.string().valid('booking', 'payment', 'promo', 'trip', 'system', 'support', 'review', 'vendor', 'guide').required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  titleTemplate: Joi.string().trim().min(5).max(200).required(),
  bodyTemplate: Joi.string().trim().min(10).max(2000).required(),
  dataTemplate: Joi.object().optional(),
  actionUrlTemplate: Joi.string().uri().optional(),
  imageUrlTemplate: Joi.string().uri().optional()
});

export const UpdateTemplateDto = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  description: Joi.string().trim().max(500).optional(),
  channels: Joi.array().items(Joi.string().valid('push', 'email', 'whatsapp', 'inapp')).min(1).optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  titleTemplate: Joi.string().trim().min(5).max(200).optional(),
  bodyTemplate: Joi.string().trim().min(10).max(2000).optional(),
  dataTemplate: Joi.object().optional(),
  actionUrlTemplate: Joi.string().uri().optional(),
  imageUrlTemplate: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional()
}).min(1);
