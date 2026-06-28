import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDestinationDocument extends Document {
  _id: string;
  name: string;
  slug: string;
  type: 'country' | 'state' | 'city' | 'locality';
  parentId?: string;
  description: string;
  shortDescription?: string;
  images: string[];
  coverImage?: string;
  tags: string[];
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
  bestTimeToVisit: {
    months: string[];
    notes?: string;
  };
  weather: {
    summer?: { temp: string; notes: string };
    monsoon?: { temp: string; notes: string };
    winter?: { temp: string; notes: string };
  };
  safetyIndex: number;
  isFeatured: boolean;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  content?: {
    history?: string;
    culture?: string;
    cuisine?: string;
    howToReach?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema = new Schema<IDestinationDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    type: { type: String, enum: ['country', 'state', 'city', 'locality'], required: true },
    parentId: { type: String, ref: 'Destination', index: true, sparse: true },
    description: { type: String, required: true, maxlength: 5000 },
    shortDescription: { type: String, maxlength: 300 },
    images: { type: [String], default: [] },
    coverImage: { type: String },
    tags: { type: [String], default: [] },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    bestTimeToVisit: {
      months: { type: [String], required: true },
      notes: { type: String },
    },
    weather: {
      summer: { temp: { type: String }, notes: { type: String } },
      monsoon: { temp: { type: String }, notes: { type: String } },
      winter: { temp: { type: String }, notes: { type: String } },
    },
    safetyIndex: { type: Number, default: 5, min: 1, max: 10 },
    isFeatured: { type: Boolean, default: false },
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: { type: [String] },
    },
    content: {
      history: { type: String },
      culture: { type: String },
      cuisine: { type: String },
      howToReach: { type: String },
    },
  },
  { timestamps: true }
);

// Indexes
DestinationSchema.index({ slug: 1 }, { unique: true, name: 'idx_dest_slug' });
DestinationSchema.index({ coordinates: '2dsphere' }, { name: 'idx_dest_geo' });
DestinationSchema.index({ type: 1, parentId: 1 }, { name: 'idx_dest_hierarchy' });
DestinationSchema.index({ isFeatured: 1, type: 1 }, { name: 'idx_dest_featured' });
DestinationSchema.index({ tags: 1 }, { name: 'idx_dest_tags' });
DestinationSchema.index({ name: 'text', description: 'text', tags: 'text' }, { name: 'idx_dest_text_search', weights: { name: 10, tags: 5, description: 2 } });

export const Destination: Model<IDestinationDocument> = mongoose.model<IDestinationDocument>('Destination', DestinationSchema);
