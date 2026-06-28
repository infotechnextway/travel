import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type NotificationChannel = 'push' | 'email' | 'whatsapp' | 'inapp';
export type NotificationTopic = 'booking' | 'payment' | 'promo' | 'trip' | 'system' | 'support' | 'review' | 'vendor' | 'guide';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface INotificationDelivery {
  channel: NotificationChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  attempts: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  externalId?: string; // FCM message ID, email message ID, WhatsApp message ID
  deliveredAt?: Date;
  readAt?: Date;
}

export interface INotification extends Document {
  _id: string;
  userId: string;
  type: string;
  topic: NotificationTopic;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  deliveries: INotificationDelivery[];
  overallStatus: 'pending' | 'partial' | 'delivered' | 'failed';
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationDeliverySchema = new Schema<INotificationDelivery>({
  channel: { type: String, enum: ['push', 'email', 'whatsapp', 'inapp'], required: true },
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'], default: 'pending' },
  attempts: { type: Number, default: 0, min: 0 },
  lastAttemptAt: { type: Date },
  errorMessage: { type: String },
  externalId: { type: String },
  deliveredAt: { type: Date },
  readAt: { type: Date }
}, { _id: false });

const NotificationSchema = new Schema<INotification>(
  {
    _id: { type: String, default: () => uuidv4() },
    userId: { type: String, required: true, ref: 'User', index: true },
    type: { type: String, required: true, index: true },
    topic: { type: String, enum: ['booking', 'payment', 'promo', 'trip', 'system', 'support', 'review', 'vendor', 'guide'], required: true, index: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    data: { type: Schema.Types.Mixed },
    imageUrl: { type: String },
    actionUrl: { type: String },
    deliveries: { type: [NotificationDeliverySchema], default: [] },
    overallStatus: { type: String, enum: ['pending', 'partial', 'delivered', 'failed'], default: 'pending', index: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    expiresAt: { type: Date, index: true }
  },
  { timestamps: true }
);

// Compound indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, topic: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, overallStatus: 1, createdAt: -1 });
NotificationSchema.index({ topic: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

// TTL index for expired notifications (30 days after creation)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const NotificationModel: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);
