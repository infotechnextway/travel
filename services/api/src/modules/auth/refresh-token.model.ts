import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRefreshTokenDocument extends Document {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdByIp?: string;
  userAgent?: string;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    userId: { type: String, required: true, ref: 'User', index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    isRevoked: { type: Boolean, default: false },
    createdByIp: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ userId: 1, isRevoked: 1 }, { name: 'idx_refresh_user_revoked' });
RefreshTokenSchema.index({ expiresAt: 1 }, { name: 'idx_refresh_expires', expireAfterSeconds: 0 });

export const RefreshToken: Model<IRefreshTokenDocument> = mongoose.model<IRefreshTokenDocument>('RefreshToken', RefreshTokenSchema);
