import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  // ─── CUSTOMER INBOX ───

  getInbox = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
        topic: req.query.topic as string,
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50
      };
      const result = await this.notificationService.getInbox(req.user.userId, filters);
      successResponse(res, 200, result.notifications, 'Inbox retrieved', { page: filters.page, limit: filters.limit, total: result.total }, { unreadCount: result.unreadCount });
    } catch (err) { next(err); }
  };

  markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.notificationService.markAsRead(req.user.userId, req.body.notificationIds);
      successResponse(res, 200, result, 'Notifications marked as read');
    } catch (err) { next(err); }
  };

  markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.notificationService.markAllAsRead(req.user.userId);
      successResponse(res, 200, result, 'All notifications marked as read');
    } catch (err) { next(err); }
  };

  getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.notificationService.getUnreadCount(req.user.userId);
      successResponse(res, 200, result, 'Unread count retrieved');
    } catch (err) { next(err); }
  };

  deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.notificationService.deleteNotification(req.user.userId, req.params.id);
      successResponse(res, 200, null, 'Notification deleted');
    } catch (err) { next(err); }
  };

  // ─── PREFERENCES ───

  getPreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const prefs = await this.notificationService.getPreferences(req.user.userId);
      successResponse(res, 200, prefs, 'Preferences retrieved');
    } catch (err) { next(err); }
  };

  updatePreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const prefs = await this.notificationService.updatePreferences(req.user.userId, req.body);
      successResponse(res, 200, prefs, 'Preferences updated');
    } catch (err) { next(err); }
  };

  // ─── ADMIN ───

  sendNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const notification = await this.notificationService.sendNotification(req.body);
      successResponse(res, 201, notification, 'Notification sent');
    } catch (err) { next(err); }
  };

  sendBulkNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.notificationService.sendBulkNotification(req.body);
      successResponse(res, 200, result, 'Bulk notification sent');
    } catch (err) { next(err); }
  };

  sendTemplatedNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const notification = await this.notificationService.sendTemplatedNotification(
        req.body.userId,
        req.body.templateCode,
        req.body.variables,
        req.body.channels
      );
      successResponse(res, 201, notification, 'Templated notification sent');
    } catch (err) { next(err); }
  };

  getAllNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        userId: req.query.userId as string,
        topic: req.query.topic as string,
        status: req.query.status as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50
      };
      const result = await this.notificationService.getAllNotifications(filters);
      successResponse(res, 200, result.notifications, 'Notifications retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await this.notificationService.getStats(startDate, endDate);
      successResponse(res, 200, stats, 'Notification statistics');
    } catch (err) { next(err); }
  };

  retryFailed = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.notificationService.retryFailedDeliveries(req.body.channel, req.body.limit || 100);
      successResponse(res, 200, result, 'Failed deliveries retried');
    } catch (err) { next(err); }
  };

  // ─── TEMPLATES ───

  createTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const template = await this.notificationService.createTemplate(req.body);
      successResponse(res, 201, template, 'Template created');
    } catch (err) { next(err); }
  };

  updateTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const template = await this.notificationService.updateTemplate(req.params.id, req.body);
      successResponse(res, 200, template, 'Template updated');
    } catch (err) { next(err); }
  };

  getTemplateByCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const template = await this.notificationService.getTemplateByCode(req.params.code);
      successResponse(res, 200, template, 'Template retrieved');
    } catch (err) { next(err); }
  };

  getAllTemplates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const templates = await this.notificationService.getAllTemplates();
      successResponse(res, 200, templates, 'Templates retrieved');
    } catch (err) { next(err); }
  };

  // ─── WEBHOOKS ───

  fcmWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId, status, error } = req.body;
      await this.notificationService.handleFcmDeliveryStatus(messageId, status, error);
      successResponse(res, 200, null, 'FCM status updated');
    } catch (err) { next(err); }
  };

  emailWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId, status, error } = req.body;
      await this.notificationService.handleEmailDeliveryStatus(messageId, status, error);
      successResponse(res, 200, null, 'Email status updated');
    } catch (err) { next(err); }
  };

  whatsappWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId, status, error } = req.body;
      await this.notificationService.handleWhatsAppDeliveryStatus(messageId, status, error);
      successResponse(res, 200, null, 'WhatsApp status updated');
    } catch (err) { next(err); }
  };
}
