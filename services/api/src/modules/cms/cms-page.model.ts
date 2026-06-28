import mongoose, { Schema, Document, Model } from 'mongoose';
import { CmsType } from '../../shared/enums';

export interface ICmsPageDocument extends Document {
  _id: string;
  slug: string;
  title: string;
  content: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
  type: CmsType;
  language: string;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };
  isPublished: boolean;
  publishedAt?: Date;
  authorId: string;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CmsPageSchema = new Schema<ICmsPageDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: [
      {
        type: { type: String, required: true },
        data: { type: Schema.Types.Mixed, required: true },
      },
    ],
    type: { type: String, enum: Object.values(CmsType), required: true },
    language: { type: String, default: 'en', trim: true },
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: { type: [String] },
      ogImage: { type: String },
      canonicalUrl: { type: String },
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    authorId: { type: String, required: true, ref: 'User' },
    tags: { type: [String], default: [] },
    viewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Compound unique on slug + language
CmsPageSchema.index({ slug: 1, language: 1 }, { unique: true, name: 'idx_cms_slug_lang' });
CmsPageSchema.index({ type: 1, isPublished: 1, publishedAt: -1 }, { name: 'idx_cms_type_published' });
CmsPageSchema.index({ tags: 1, isPublished: 1 }, { name: 'idx_cms_tags' });
CmsPageSchema.index({ isPublished: 1, createdAt: -1 }, { name: 'idx_cms_published_created' });
CmsPageSchema.index({ title: 'text', tags: 'text' }, { name: 'idx_cms_text', weights: { title: 10, tags: 5 } });

export const CmsPage: Model<ICmsPageDocument> = mongoose.model<ICmsPageDocument>('CmsPage', CmsPageSchema);
