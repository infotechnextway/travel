import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtpDocument extends Document {
  _id: string;
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtpDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0, min: 0 },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtpSchema.index({ phone: 1, isUsed: 1, createdAt: -1 }, { name: 'idx_otp_phone_recent' });
OtpSchema.index({ expiresAt: 1 }, { name: 'idx_otp_expires', expireAfterSeconds: 0 });

export const OTP: Model<IOtpDocument> = mongoose.model<IOtpDocument>('OTP', OtpSchema);
