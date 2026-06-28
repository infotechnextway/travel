import mongoose, { Schema, Document, Model } from 'mongoose';
import { VerificationStatus, DifficultyLevel } from '../../shared/enums';

export interface IGuideDocument extends Document {
  _id: string;
  userId: string;
  vendorId?: string;
  bio: string;
  languages: string[];
  skills: string[];
  certifications: Array<{
    _id?: string;
    name: string;
    issuedBy: string;
    issuedAt: Date;
    expiresAt?: Date;
    documentUrl: string;
    isVerified: boolean;
  }>;
  experienceYears: number;
  availability: Array<{
    _id?: string;
    date: Date;
    isAvailable: boolean;
    listingIds: string[];
  }>;
  rating: number;
  tripCount: number;
  totalEarnings: number;
  isActive: boolean;
  verificationStatus: VerificationStatus;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  preferredDestinations: string[];
  maxGroupSize: number;
  emergencyContact: {
    name: string;
    phone: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const GuideSchema = new Schema<IGuideDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    userId: { type: String, required: true, ref: 'User', index: true },
    vendorId: { type: String, ref: 'Vendor', index: true, sparse: true },
    bio: { type: String, required: true, maxlength: 2000 },
    languages: { type: [String], required: true, default: ['English'] },
    skills: { type: [String], required: true },
    certifications: [
      {
        name: { type: String, required: true },
        issuedBy: { type: String, required: true },
        issuedAt: { type: Date, required: true },
        expiresAt: { type: Date },
        documentUrl: { type: String, required: true },
        isVerified: { type: Boolean, default: false },
      },
    ],
    experienceYears: { type: Number, default: 0, min: 0 },
    availability: [
      {
        date: { type: Date, required: true },
        isAvailable: { type: Boolean, default: true },
        listingIds: { type: [String], default: [] },
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    tripCount: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' },
    },
    preferredDestinations: { type: [String], default: [] },
    maxGroupSize: { type: Number, default: 20, min: 1 },
    emergencyContact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Indexes
GuideSchema.index({ userId: 1 }, { unique: true, name: 'idx_guide_user' });
GuideSchema.index({ vendorId: 1, isActive: 1 }, { name: 'idx_guide_vendor_active' });
GuideSchema.index({ location: '2dsphere' }, { name: 'idx_guide_geo' });
GuideSchema.index({ skills: 1 }, { name: 'idx_guide_skills' });
GuideSchema.index({ languages: 1 }, { name: 'idx_guide_languages' });
GuideSchema.index({ rating: -1, tripCount: -1 }, { name: 'idx_guide_popularity' });
GuideSchema.index({ verificationStatus: 1, isActive: 1 }, { name: 'idx_guide_verified_active' });
GuideSchema.index({ 'availability.date': 1, 'availability.isAvailable': 1 }, { name: 'idx_guide_availability' });
GuideSchema.index({ preferredDestinations: 1 }, { name: 'idx_guide_destinations' });
GuideSchema.index({ experienceYears: -1 }, { name: 'idx_guide_experience' });

export const Guide: Model<IGuideDocument> = mongoose.model<IGuideDocument>('Guide', GuideSchema);
