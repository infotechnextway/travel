import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsEventDocument extends Document {
  _id: string;
  eventType: string;
  userId?: string;
  sessionId: string;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    platform?: string;
    appVersion?: string;
  };
  properties: Record<string, unknown>;
  timestamp: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEventDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    eventType: { type: String, required: true, trim: true, index: true },
    userId: { type: String, ref: 'User', index: true, sparse: true },
    sessionId: { type: String, required: true, index: true },
    deviceInfo: {
      userAgent: { type: String },
      ip: { type: String },
      platform: { type: String },
      appVersion: { type: String },
    },
    properties: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Indexes
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 }, { name: 'idx_analytics_event_time' });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 }, { name: 'idx_analytics_user_time', sparse: true });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: -1 }, { name: 'idx_analytics_session_time' });
AnalyticsEventSchema.index({ timestamp: 1 }, { name: 'idx_analytics_ttl', expireAfterSeconds: 7776000 }); // 90 days TTL

export const AnalyticsEvent: Model<IAnalyticsEventDocument> = mongoose.model<IAnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema);
