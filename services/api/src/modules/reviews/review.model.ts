import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IRatingDimension {
  cleanliness: number;
  value: number;
  communication: number;
  location: number;
  accuracy: number;
  service: number;
  amenities: number;
}

export interface IReviewMedia {
  _id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt: Date;
}

export interface IReviewHelpfulVote {
  userId: string;
  isHelpful: boolean;
  createdAt: Date;
}

export interface IReview extends Document {
  _id: string;
  bookingId: string;
  customerId: string;
  listingId: string;
  vendorId: string;
  guideId?: string;
  rating: number; // overall 1-5
  dimensions: IRatingDimension;
  title: string;
  comment: string;
  media: IReviewMedia[];
  isVerified: boolean;
  isApproved: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationReason?: string;
  moderatedBy?: string;
  moderatedAt?: Date;
  vendorResponse?: {
    text: string;
    respondedAt: Date;
    respondedBy: string;
  };
  helpfulVotes: IReviewHelpfulVote[];
  helpfulCount: number;
  unhelpfulCount: number;
  reportedCount: number;
  reportReasons?: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingDimensionSchema = new Schema<IRatingDimension>({
  cleanliness: { type: Number, min: 1, max: 5, required: true },
  value: { type: Number, min: 1, max: 5, required: true },
  communication: { type: Number, min: 1, max: 5, required: true },
  location: { type: Number, min: 1, max: 5, required: true },
  accuracy: { type: Number, min: 1, max: 5, required: true },
  service: { type: Number, min: 1, max: 5, required: true },
  amenities: { type: Number, min: 1, max: 5, required: true }
}, { _id: false });

const ReviewMediaSchema = new Schema<IReviewMedia>({
  _id: { type: String, default: () => uuidv4() },
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  thumbnailUrl: { type: String },
  caption: { type: String, trim: true, maxlength: 200 },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const ReviewHelpfulVoteSchema = new Schema<IReviewHelpfulVote>({
  userId: { type: String, required: true, ref: 'User' },
  isHelpful: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ReviewSchema = new Schema<IReview>(
  {
    _id: { type: String, default: () => uuidv4() },
    bookingId: { type: String, required: true, ref: 'Booking', unique: true, index: true },
    customerId: { type: String, required: true, ref: 'User', index: true },
    listingId: { type: String, required: true, ref: 'Listing', index: true },
    vendorId: { type: String, required: true, ref: 'Vendor', index: true },
    guideId: { type: String, ref: 'Guide' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    dimensions: { type: RatingDimensionSchema, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    comment: { type: String, required: true, trim: true, maxlength: 5000 },
    media: { type: [ReviewMediaSchema], default: [] },
    isVerified: { type: Boolean, default: true, index: true },
    isApproved: { type: Boolean, default: false, index: true },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true
    },
    moderationReason: { type: String, trim: true, maxlength: 500 },
    moderatedBy: { type: String, ref: 'User' },
    moderatedAt: { type: Date },
    vendorResponse: {
      text: { type: String, trim: true, maxlength: 2000 },
      respondedAt: { type: Date },
      respondedBy: { type: String, ref: 'User' }
    },
    helpfulVotes: { type: [ReviewHelpfulVoteSchema], default: [] },
    helpfulCount: { type: Number, default: 0, index: true },
    unhelpfulCount: { type: Number, default: 0 },
    reportedCount: { type: Number, default: 0, index: true },
    reportReasons: [{ type: String, trim: true }],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: String, ref: 'User' }
  },
  { timestamps: true }
);

// Compound indexes
ReviewSchema.index({ listingId: 1, isApproved: 1, isDeleted: 1, createdAt: -1 });
ReviewSchema.index({ vendorId: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });
ReviewSchema.index({ moderationStatus: 1, createdAt: 1 });
ReviewSchema.index({ rating: 1, isApproved: 1, isDeleted: 1 });
ReviewSchema.index({ helpfulCount: -1, isApproved: 1 });
ReviewSchema.index({ reportedCount: -1, moderationStatus: 1 });

// Text index for moderation search
ReviewSchema.index({ title: 'text', comment: 'text', 'vendorResponse.text': 'text' });

export const ReviewModel: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);
