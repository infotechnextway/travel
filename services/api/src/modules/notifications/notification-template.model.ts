import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface INotificationTemplate extends Document {
  _id: string;
  code: string;
  name: string;
  description?: string;
  channels: string[];
  topic: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  titleTemplate: string;
  bodyTemplate: string;
  dataTemplate?: Record<string, string>;
  actionUrlTemplate?: string;
  imageUrlTemplate?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    _id: { type: String, default: () => uuidv4() },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    channels: [{ type: String, enum: ['push', 'email', 'whatsapp', 'inapp'] }],
    topic: { type: String, enum: ['booking', 'payment', 'promo', 'trip', 'system', 'support', 'review', 'vendor', 'guide'], required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    titleTemplate: { type: String, required: true },
    bodyTemplate: { type: String, required: true },
    dataTemplate: { type: Schema.Types.Mixed },
    actionUrlTemplate: { type: String },
    imageUrlTemplate: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const NotificationTemplateModel: Model<INotificationTemplate> = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);
