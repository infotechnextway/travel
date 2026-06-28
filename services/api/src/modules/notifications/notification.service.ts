import { NotificationRepository, NotificationPreferenceRepository, NotificationTemplateRepository } from './notification.repository';
import { INotification, NotificationChannel } from './notification.model';
import { INotificationPreference } from './notification-preference.model';
import { AppError, NotFoundError, ValidationError } from '@shared/errors';
import { UserRepository } from '@modules/users/user.repository';

// Providers would be imported in production:
// import admin from 'firebase-admin';
// import nodemailer from 'nodemailer';
// import { WhatsAppBusinessAPI } from './providers/whatsapp';

export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private preferenceRepo: NotificationPreferenceRepository,
    private templateRepo: NotificationTemplateRepository,
    private userRepo: UserRepository
  ) {}

  // ─── CORE NOTIFICATION CREATION ───

  async sendNotification(dto: any): Promise<INotification> {
    const user = await this.userRepo.findById(dto.userId);
    if (!user) throw new NotFoundError('User not found');

    const preferences = await this.preferenceRepo.getOrCreate(dto.userId);

    // Determine channels to use
    const requestedChannels: NotificationChannel[] = dto.channels || ['push', 'email', 'inapp'];
    const enabledChannels = requestedChannels.filter(ch => this.isChannelEnabled(preferences, ch, dto.topic));

    if (enabledChannels.length === 0) {
      // Still create inapp notification even if all channels disabled
      enabledChannels.push('inapp');
    }

    // Check quiet hours for non-urgent
    if (dto.priority !== 'urgent') {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const ch of [...enabledChannels]) {
        if (!this.isWithinQuietHours(preferences, ch, currentTime)) {
          const idx = enabledChannels.indexOf(ch);
          if (idx > -1) enabledChannels.splice(idx, 1);
        }
      }
    }

    const deliveries = enabledChannels.map(channel => ({
      channel,
      status: 'pending' as const,
      attempts: 0
    }));

    const notification = await this.notificationRepo.create({
      userId: dto.userId,
      type: dto.type,
      topic: dto.topic,
      priority: dto.priority,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      imageUrl: dto.imageUrl,
      actionUrl: dto.actionUrl,
      deliveries,
      overallStatus: 'pending',
      expiresAt: dto.expiresAt
    } as any);

    // Dispatch to channels asynchronously
    for (const delivery of deliveries) {
      this.dispatchToChannel(notification, delivery.channel).catch(err => {
        console.error(`Notification dispatch failed: ${delivery.channel}`, err);
      });
    }

    return notification;
  }

  async sendBulkNotification(dto: any): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of dto.userIds) {
      try {
        await this.sendNotification({ ...dto, userId });
        sent++;
      } catch (err) {
        failed++;
      }
    }

    return { sent, failed };
  }

  async sendTemplatedNotification(userId: string, templateCode: string, variables: Record<string, string>, channels?: NotificationChannel[]): Promise<INotification> {
    const template = await this.templateRepo.findByCode(templateCode);
    if (!template) throw new NotFoundError('Notification template not found');

    const title = this.renderTemplate(template.titleTemplate, variables);
    const body = this.renderTemplate(template.bodyTemplate, variables);
    const data = template.dataTemplate ? this.renderTemplateObject(template.dataTemplate, variables) : undefined;
    const actionUrl = template.actionUrlTemplate ? this.renderTemplate(template.actionUrlTemplate, variables) : undefined;
    const imageUrl = template.imageUrlTemplate ? this.renderTemplate(template.imageUrlTemplate, variables) : undefined;

    return this.sendNotification({
      userId,
      type: templateCode,
      topic: template.topic,
      priority: template.priority,
      title,
      body,
      data,
      actionUrl,
      imageUrl,
      channels: channels || template.channels
    });
  }

  // ─── CHANNEL DISPATCHERS ───

  private async dispatchToChannel(notification: INotification, channel: NotificationChannel): Promise<void> {
    try {
      switch (channel) {
        case 'push':
          await this.sendPush(notification);
          break;
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'whatsapp':
          await this.sendWhatsApp(notification);
          break;
        case 'inapp':
          await this.sendInApp(notification);
          break;
      }
    } catch (err: any) {
      await this.notificationRepo.updateDeliveryStatus(
        notification._id,
        channel,
        'failed',
        undefined,
        err.message
      );
    }
  }

  private async sendPush(notification: INotification): Promise<void> {
    // Firebase Cloud Messaging integration (mocked)
    const fcmToken = await this.getFcmToken(notification.userId);
    if (!fcmToken) {
      await this.notificationRepo.updateDeliveryStatus(notification._id, 'push', 'failed', undefined, 'No FCM token');
      return;
    }

    // Mock FCM send
    const messageId = `fcm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await this.notificationRepo.updateDeliveryStatus(notification._id, 'push', 'sent', messageId);

    // In production: await admin.messaging().send({ token: fcmToken, notification: { title, body }, data });
  }

  private async sendEmail(notification: INotification): Promise<void> {
    // SMTP / SendGrid integration (mocked)
    const user = await this.userRepo.findById(notification.userId);
    if (!user?.profile?.email) {
      await this.notificationRepo.updateDeliveryStatus(notification._id, 'email', 'failed', undefined, 'No email address');
      return;
    }

    const messageId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await this.notificationRepo.updateDeliveryStatus(notification._id, 'email', 'sent', messageId);

    // In production: await transporter.sendMail({ to, subject: title, html: body });
  }

  private async sendWhatsApp(notification: INotification): Promise<void> {
    // WhatsApp Business API integration (mocked)
    const user = await this.userRepo.findById(notification.userId);
    if (!user?.phone) {
      await this.notificationRepo.updateDeliveryStatus(notification._id, 'whatsapp', 'failed', undefined, 'No phone number');
      return;
    }

    const messageId = `wa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await this.notificationRepo.updateDeliveryStatus(notification._id, 'whatsapp', 'sent', messageId);

    // In production: await whatsappApi.sendMessage({ to: phone, template: body });
  }

  private async sendInApp(notification: INotification): Promise<void> {
    // In-app is always "delivered" immediately
    await this.notificationRepo.updateDeliveryStatus(notification._id, 'inapp', 'delivered', `inapp_${notification._id}`);
  }

  // ─── WEBHOOK HANDLERS ───

  async handleFcmDeliveryStatus(messageId: string, status: 'delivered' | 'failed', error?: string): Promise<void> {
    const notification = await this.notificationRepo.model.findOne({ 'deliveries.externalId': messageId }).lean();
    if (!notification) return;

    await this.notificationRepo.updateDeliveryStatus(
      notification._id,
      'push',
      status,
      messageId,
      error
    );
  }

  async handleEmailDeliveryStatus(messageId: string, status: 'delivered' | 'bounced' | 'failed', error?: string): Promise<void> {
    const notification = await this.notificationRepo.model.findOne({ 'deliveries.externalId': messageId }).lean();
    if (!notification) return;

    await this.notificationRepo.updateDeliveryStatus(
      notification._id,
      'email',
      status === 'bounced' ? 'bounced' : status,
      messageId,
      error
    );
  }

  async handleWhatsAppDeliveryStatus(messageId: string, status: 'delivered' | 'failed' | 'read', error?: string): Promise<void> {
    const notification = await this.notificationRepo.model.findOne({ 'deliveries.externalId': messageId }).lean();
    if (!notification) return;

    await this.notificationRepo.updateDeliveryStatus(
      notification._id,
      'whatsapp',
      status === 'read' ? 'delivered' : status,
      messageId,
      error
    );
  }

  // ─── PREFERENCES ───

  async getPreferences(userId: string): Promise<INotificationPreference> {
    return this.preferenceRepo.getOrCreate(userId);
  }

  async updatePreferences(userId: string, dto: any): Promise<INotificationPreference> {
    const pref = await this.preferenceRepo.getOrCreate(userId);
    const updates: any = {};

    if (dto.channels) {
      for (const [channel, settings] of Object.entries(dto.channels)) {
        if (settings) {
          updates[`channels.${channel}`] = settings;
        }
      }
    }
    if (dto.topics) {
      for (const [topic, enabled] of Object.entries(dto.topics)) {
        if (enabled !== undefined) updates[`topics.${topic}`] = enabled;
      }
    }
    if (dto.digestEmail !== undefined) updates.digestEmail = dto.digestEmail;
    if (dto.digestFrequency) updates.digestFrequency = dto.digestFrequency;
    if (dto.marketingOptIn !== undefined) updates.marketingOptIn = dto.marketingOptIn;

    return this.preferenceRepo.update(userId, updates) as Promise<INotificationPreference>;
  }

  // ─── INBOX ───

  async getInbox(userId: string, filters: any): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    return this.notificationRepo.findByUserId(userId, filters, filters.page, filters.limit);
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<{ marked: number }> {
    const marked = await this.notificationRepo.markAsRead(userId, notificationIds);
    return { marked };
  }

  async markAllAsRead(userId: string): Promise<{ marked: number }> {
    const marked = await this.notificationRepo.markAllAsRead(userId);
    return { marked };
  }

  async getUnreadCount(userId: string): Promise<{ total: number; byTopic: Record<string, number> }> {
    const [total, byTopic] = await Promise.all([
      this.notificationRepo.getUnreadCount(userId),
      this.notificationRepo.getUnreadByTopic(userId)
    ]);
    return { total, byTopic };
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) throw new NotFoundError('Notification not found');
    if (notification.userId !== userId) throw new ValidationError('Not your notification');
    await this.notificationRepo.delete(notificationId);
  }

  // ─── TEMPLATES ───

  async createTemplate(dto: any): Promise<any> {
    const existing = await this.templateRepo.findByCode(dto.code);
    if (existing) throw new ValidationError('Template code already exists');
    return this.templateRepo.create(dto as any);
  }

  async updateTemplate(templateId: string, dto: any): Promise<any> {
    return this.templateRepo.update(templateId, dto);
  }

  async getTemplateByCode(code: string): Promise<any> {
    const template = await this.templateRepo.findByCode(code);
    if (!template) throw new NotFoundError('Template not found');
    return template;
  }

  async getAllTemplates(): Promise<any[]> {
    return this.templateRepo.findAll();
  }

  // ─── ADMIN ───

  async getAllNotifications(filters: any): Promise<{ notifications: INotification[]; total: number }> {
    const query: any = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.topic) query.topic = filters.topic;
    if (filters.status) query.overallStatus = filters.status;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const [notifications, total] = await Promise.all([
      this.notificationRepo.model.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
      this.notificationRepo.model.countDocuments(query)
    ]);
    return { notifications, total };
  }

  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    return this.notificationRepo.getNotificationStats(startDate, endDate);
  }

  async retryFailedDeliveries(channel: NotificationChannel, limit: number = 100): Promise<{ retried: number }> {
    const pending = await this.notificationRepo.findPendingDeliveries(channel, limit);
    let retried = 0;

    for (const notification of pending) {
      try {
        await this.dispatchToChannel(notification, channel);
        retried++;
      } catch (err) {
        console.error(`Retry failed for ${notification._id}`, err);
      }
    }

    return { retried };
  }

  // ─── HELPERS ───

  private isChannelEnabled(preferences: INotificationPreference, channel: NotificationChannel, topic: string): boolean {
    const channelPref = preferences.channels[channel];
    if (!channelPref || !channelPref.enabled) return false;
    const topicPref = (preferences.topics as any)[topic];
    if (topicPref === false) return false;
    return true;
  }

  private isWithinQuietHours(preferences: INotificationPreference, channel: NotificationChannel, currentTime: string): boolean {
    const channelPref = preferences.channels[channel];
    if (!channelPref?.quietHoursStart || !channelPref?.quietHoursEnd) return true;

    const start = channelPref.quietHoursStart;
    const end = channelPref.quietHoursEnd;

    // Simple string comparison works for HH:MM format
    if (start < end) {
      return currentTime < start || currentTime > end;
    } else {
      // Crosses midnight (e.g., 22:00 - 07:00)
      return currentTime > end && currentTime < start;
    }
  }

  private async getFcmToken(userId: string): Promise<string | null> {
    // In production: fetch from user device tokens collection
    return `fcm_token_${userId}`;
  }

  private renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
  }

  private renderTemplateObject(templateObj: Record<string, string>, variables: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(templateObj)) {
      result[key] = this.renderTemplate(value, variables);
    }
    return result;
  }
}
