import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  SendNotificationDto, BulkSendNotificationDto, UpdatePreferencesDto,
  MarkReadDto, NotificationSearchDto, CreateTemplateDto, UpdateTemplateDto
} from './notification.dto';
import { Permission } from '@shared/enums';

export const createNotificationRoutes = (controller: NotificationController): Router => {
  const router = Router();

  // ─── CUSTOMER INBOX ───
  router.get('/inbox', authenticate, validateQuery(NotificationSearchDto), controller.getInbox);
  router.post('/inbox/read', authenticate, validate(MarkReadDto), controller.markAsRead);
  router.post('/inbox/read-all', authenticate, controller.markAllAsRead);
  router.get('/inbox/unread-count', authenticate, controller.getUnreadCount);
  router.delete('/inbox/:id', authenticate, controller.deleteNotification);

  // ─── PREFERENCES ───
  router.get('/preferences', authenticate, controller.getPreferences);
  router.patch('/preferences', authenticate, validate(UpdatePreferencesDto), controller.updatePreferences);

  // ─── ADMIN ───
  router.post('/admin/send', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), validate(SendNotificationDto), controller.sendNotification);
  router.post('/admin/send-bulk', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), validate(BulkSendNotificationDto), controller.sendBulkNotification);
  router.post('/admin/send-template', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), controller.sendTemplatedNotification);
  router.get('/admin/all', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), validateQuery(NotificationSearchDto), controller.getAllNotifications);
  router.get('/admin/stats', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), controller.getStats);
  router.post('/admin/retry', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), controller.retryFailed);

  // ─── TEMPLATES ───
  router.post('/admin/templates', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), validate(CreateTemplateDto), controller.createTemplate);
  router.patch('/admin/templates/:id', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), validate(UpdateTemplateDto), controller.updateTemplate);
  router.get('/admin/templates/:code', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), controller.getTemplateByCode);
  router.get('/admin/templates', authenticate, authorize(Permission.MANAGE_NOTIFICATIONS), controller.getAllTemplates);

  // ─── WEBHOOKS (No auth - verified by signature) ───
  router.post('/webhooks/fcm', controller.fcmWebhook);
  router.post('/webhooks/email', controller.emailWebhook);
  router.post('/webhooks/whatsapp', controller.whatsappWebhook);

  return router;
};
