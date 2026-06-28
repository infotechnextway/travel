import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IFaq extends Document {
  _id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  order: number;
  isPublished: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema = new Schema<IFaq>(
  {
    _id: { type: String, default: () => uuidv4() },
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer: { type: String, required: true, trim: true, maxlength: 10000 },
    category: { type: String, required: true, trim: true, index: true },
    tags: [{ type: String, trim: true }],
    order: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    viewCount: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
    notHelpfulCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

FaqSchema.index({ category: 1, order: 1 });
FaqSchema.index({ isPublished: 1, category: 1 });

export const FaqModel: Model<IFaq> = mongoose.model<IFaq>('Faq', FaqSchema);
