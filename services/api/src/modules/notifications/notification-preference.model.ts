import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type NotificationChannel = 'push' | 'email' | 'whatsapp' | 'inapp';
export type NotificationTopic = 'booking' | 'payment' | 'promo' | 'trip' | 'system' | 'support' | 'review' | 'vendor' | 'guide';

export interface IChannelPreference {
  enabled: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;
}

export interface INotificationPreference extends Document {
  _id: string;
  userId: string;
  channels: Record<NotificationChannel, IChannelPreference>;
  topics: Record<NotificationTopic, boolean>;
  digestEmail: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
  marketingOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelPreferenceSchema = new Schema<IChannelPreference>({
  enabled: { type: Boolean, default: true },
  quietHoursStart: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
  quietHoursEnd: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ }
}, { _id: false });

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    _id: { type: String, default: () => uuidv4() },
    userId: { type: String, required: true, unique: true, ref: 'User', index: true },
    channels: {
      push: { type: ChannelPreferenceSchema, default: () => ({ enabled: true }) },
      email: { type: ChannelPreferenceSchema, default: () => ({ enabled: true }) },
      whatsapp: { type: ChannelPreferenceSchema, default: () => ({ enabled: true }) },
      inapp: { type: ChannelPreferenceSchema, default: () => ({ enabled: true }) }
    },
    topics: {
      booking: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
      promo: { type: Boolean, default: true },
      trip: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      support: { type: Boolean, default: true },
      review: { type: Boolean, default: true },
      vendor: { type: Boolean, default: true },
      guide: { type: Boolean, default: true }
    },
    digestEmail: { type: Boolean, default: false },
    digestFrequency: { type: String, enum: ['daily', 'weekly', 'never'], default: 'never' },
    marketingOptIn: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const NotificationPreferenceModel: Model<INotificationPreference> = mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);
