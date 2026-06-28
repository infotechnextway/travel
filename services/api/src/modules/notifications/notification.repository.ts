import { FilterQuery } from 'mongoose';
import { NotificationModel, INotification, NotificationChannel } from './notification.model';
import { NotificationPreferenceModel, INotificationPreference } from './notification-preference.model';
import { NotificationTemplateModel, INotificationTemplate } from './notification-template.model';
import { BaseRepository } from '@shared/repository';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }

  async findByUserId(
    userId: string,
    filters: {
      isRead?: boolean;
      topic?: string;
      status?: string;
    },
    page: number = 1,
    limit: number = 50
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const query: FilterQuery<INotification> = { userId };
    if (filters.isRead !== undefined) query.isRead = filters.isRead;
    if (filters.topic) query.topic = filters.topic;
    if (filters.status) query.overallStatus = filters.status;

    const [notifications, total, unreadCount] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query),
      this.model.countDocuments({ userId, isRead: false })
    ]);
    return { notifications, total, unreadCount };
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<number> {
    const result = await this.model.updateMany(
      { _id: { $in: notificationIds }, userId },
      { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.model.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({ userId, isRead: false });
  }

  async getUnreadByTopic(userId: string): Promise<Record<string, number>> {
    const result = await this.model.aggregate([
      { $match: { userId, isRead: false } },
      { $group: { _id: '$topic', count: { $sum: 1 } } }
    ]);
    return result.reduce((acc: any, r: any) => ({ ...acc, [r._id]: r.count }), {});
  }

  async findPendingDeliveries(channel: NotificationChannel, limit: number = 100): Promise<INotification[]> {
    return this.model.find({
      'deliveries.channel': channel,
      'deliveries.status': { $in: ['pending', 'failed'] },
      'deliveries.attempts': { $lt: 3 }
    }).sort({ createdAt: 1 }).limit(limit).lean();
  }

  async updateDeliveryStatus(
    notificationId: string,
    channel: NotificationChannel,
    status: string,
    externalId?: string,
    errorMessage?: string
  ): Promise<void> {
    const update: any = {
      'deliveries.$.status': status,
      'deliveries.$.lastAttemptAt': new Date(),
      $inc: { 'deliveries.$.attempts': 1 }
    };
    if (externalId) update['deliveries.$.externalId'] = externalId;
    if (errorMessage) update['deliveries.$.errorMessage'] = errorMessage;
    if (status === 'delivered') update['deliveries.$.deliveredAt'] = new Date();

    await this.model.updateOne(
      { _id: notificationId, 'deliveries.channel': channel },
      update
    );

    // Update overall status
    const notification = await this.model.findById(notificationId).lean();
    if (notification) {
      const statuses = notification.deliveries.map((d: any) => d.status);
      let overallStatus = 'pending';
      if (statuses.every((s: string) => s === 'delivered')) overallStatus = 'delivered';
      else if (statuses.some((s: string) => s === 'delivered')) overallStatus = 'partial';
      else if (statuses.every((s: string) => s === 'failed' || s === 'bounced')) overallStatus = 'failed';

      await this.model.updateOne({ _id: notificationId }, { overallStatus });
    }
  }

  async getNotificationStats(startDate?: Date, endDate?: Date): Promise<any> {
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const [byTopic, byStatus, byChannel, daily] = await Promise.all([
      this.model.aggregate([{ $match: match }, { $group: { _id: '$topic', count: { $sum: 1 } } }]),
      this.model.aggregate([{ $match: match }, { $group: { _id: '$overallStatus', count: { $sum: 1 } } }]),
      this.model.aggregate([
        { $match: match },
        { $unwind: '$deliveries' },
        { $group: { _id: '$deliveries.channel', count: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$deliveries.status', 'delivered'] }, 1, 0] } }, failed: { $sum: { $cond: [{ $in: ['$deliveries.status', ['failed', 'bounced']] }, 1, 0] } } } }
      ]),
      this.model.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ])
    ]);

    return { byTopic, byStatus, byChannel, daily };
  }
}

export class NotificationPreferenceRepository {
  async findByUserId(userId: string): Promise<INotificationPreference | null> {
    return NotificationPreferenceModel.findOne({ userId }).lean();
  }

  async getOrCreate(userId: string): Promise<INotificationPreference> {
    let pref = await this.findByUserId(userId);
    if (!pref) {
      pref = await NotificationPreferenceModel.create({ userId } as any);
    }
    return pref;
  }

  async update(userId: string, updates: Partial<INotificationPreference>): Promise<INotificationPreference | null> {
    return NotificationPreferenceModel.findOneAndUpdate({ userId }, updates, { new: true }).lean();
  }
}

export class NotificationTemplateRepository extends BaseRepository<INotificationTemplate> {
  constructor() {
    super(NotificationTemplateModel);
  }

  async findByCode(code: string): Promise<INotificationTemplate | null> {
    return this.model.findOne({ code, isActive: true }).lean();
  }

  async findByTopic(topic: string): Promise<INotificationTemplate[]> {
    return this.model.find({ topic, isActive: true }).lean();
  }
}
