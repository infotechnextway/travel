import mongoose, { Schema, Document, Model } from 'mongoose';
import slugify from 'slugify';
import { ListingType, ListingStatus, DifficultyLevel, CancellationPolicy } from '../../shared/enums';

export interface IPriceSlab {
  minPax: number;
  maxPax: number;
  pricePerPerson: number;
}

export interface IItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: { breakfast?: boolean; lunch?: boolean; dinner?: boolean };
  accommodation?: string;
  transport?: string;
  images?: string[];
}

export interface IRoomType {
  name: string;
  description?: string;
  maxOccupancy: number;
  bedConfiguration: string;
  sizeSqFt?: number;
  amenities: string[];
  images: string[];
  basePrice: number;
  extraBedPrice?: number;
  totalRooms: number;
}

export interface IListingDocument extends Document {
  _id: string;
  vendorId: string;
  guideIds: string[];
  destinationId: string;
  listingType: ListingType;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  videos: string[];
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
  pricing: {
    basePrice: number;
    currency: string;
    pricePerPerson: number;
    childPrice?: number;
    infantPrice?: number;
    groupSlabs: IPriceSlab[];
    taxRate: number;
    serviceFee: number;
    isNegotiable: boolean;
  };
  inventory: {
    maxCapacity: number;
    minGroupSize: number;
    maxGroupSize: number;
    availableDates: Array<{
      date: Date;
      slots: number;
      priceOverride?: number;
      isBlackout: boolean;
    }>;
    bookingCutoffHours: number;
  };
  inclusions: string[];
  exclusions: string[];
  amenities: string[];
  tags: string[];
  languagesOffered: string[];
  cancellationPolicy: CancellationPolicy;
  status: ListingStatus;
  rating: number;
  reviewCount: number;
  bookingCount: number;
  viewCount: number;
  wishlistCount: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  // Tour-specific
  itinerary?: IItineraryDay[];
  durationDays?: number;
  durationHours?: number;
  difficulty?: DifficultyLevel;
  minAge?: number;
  maxAge?: number;
  startTime?: string;
  endTime?: string;
  meetingPoint?: string;
  dropOffPoint?: string;
  // Hotel-specific
  propertyType?: string;
  starRating?: number;
  checkInTime?: string;
  checkOutTime?: string;
  roomTypes?: IRoomType[];
  // Activity-specific
  activityCategory?: string;
  safetyBriefing?: string;
  equipmentProvided?: string[];
  equipmentRequired?: string[];
  weatherDependency?: boolean;
  // Transport-specific
  transportType?: string;
  fleetDetails?: Array<{
    vehicleType: string;
    capacity: number;
    features: string[];
    pricePerKm?: number;
    pricePerDay?: number;
  }>;
  route?: {
    origin: string;
    destination: string;
    stops: string[];
    distanceKm?: number;
    durationHours?: number;
  };
  isInstantBook: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PriceSlabSchema = new Schema<IPriceSlab>(
  {
    minPax: { type: Number, required: true, min: 1 },
    maxPax: { type: Number, required: true, min: 1 },
    pricePerPerson: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ItineraryDaySchema = new Schema<IItineraryDay>(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    activities: { type: [String], default: [] },
    meals: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
    },
    accommodation: { type: String },
    transport: { type: String },
    images: { type: [String], default: [] },
  },
  { _id: false }
);

const RoomTypeSchema = new Schema<IRoomType>(
  {
    name: { type: String, required: true },
    description: { type: String },
    maxOccupancy: { type: Number, required: true, min: 1 },
    bedConfiguration: { type: String, required: true },
    sizeSqFt: { type: Number, min: 50 },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    extraBedPrice: { type: Number, min: 0 },
    totalRooms: { type: Number, required: true, min: 1 },
  },
  { _id: true }
);

const ListingSchema = new Schema<IListingDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    vendorId: { type: String, required: true, ref: 'Vendor', index: true },
    guideIds: { type: [String], ref: 'Guide', default: [], index: true },
    destinationId: { type: String, required: true, ref: 'Destination', index: true },
    listingType: { type: String, enum: Object.values(ListingType), required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, maxlength: 10000 },
    shortDescription: { type: String, maxlength: 300 },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    pricing: {
      basePrice: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      pricePerPerson: { type: Number, required: true, min: 0 },
      childPrice: { type: Number, min: 0 },
      infantPrice: { type: Number, min: 0 },
      groupSlabs: { type: [PriceSlabSchema], default: [] },
      taxRate: { type: Number, default: 0.18, min: 0, max: 1 },
      serviceFee: { type: Number, default: 0, min: 0 },
      isNegotiable: { type: Boolean, default: false },
    },
    inventory: {
      maxCapacity: { type: Number, default: 20, min: 1 },
      minGroupSize: { type: Number, default: 1, min: 1 },
      maxGroupSize: { type: Number, default: 20, min: 1 },
      availableDates: [
        {
          date: { type: Date, required: true },
          slots: { type: Number, required: true, min: 0 },
          priceOverride: { type: Number, min: 0 },
          isBlackout: { type: Boolean, default: false },
        },
      ],
      bookingCutoffHours: { type: Number, default: 24, min: 0 },
    },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    languagesOffered: { type: [String], default: ['English'] },
    cancellationPolicy: { type: String, enum: Object.values(CancellationPolicy), default: CancellationPolicy.MODERATE },
    status: { type: String, enum: Object.values(ListingStatus), default: ListingStatus.DRAFT, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    bookingCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    wishlistCount: { type: Number, default: 0, min: 0 },
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: { type: [String] },
    },
    // Tour fields
    itinerary: { type: [ItineraryDaySchema] },
    durationDays: { type: Number, min: 1 },
    durationHours: { type: Number, min: 1 },
    difficulty: { type: String, enum: Object.values(DifficultyLevel) },
    minAge: { type: Number, min: 0 },
    maxAge: { type: Number, min: 0 },
    startTime: { type: String },
    endTime: { type: String },
    meetingPoint: { type: String },
    dropOffPoint: { type: String },
    // Hotel fields
    propertyType: { type: String },
    starRating: { type: Number, min: 1, max: 5 },
    checkInTime: { type: String },
    checkOutTime: { type: String },
    roomTypes: { type: [RoomTypeSchema] },
    // Activity fields
    activityCategory: { type: String },
    safetyBriefing: { type: String },
    equipmentProvided: { type: [String] },
    equipmentRequired: { type: [String] },
    weatherDependency: { type: Boolean, default: false },
    // Transport fields
    transportType: { type: String },
    fleetDetails: [
      {
        vehicleType: { type: String, required: true },
        capacity: { type: Number, required: true, min: 1 },
        features: { type: [String], default: [] },
        pricePerKm: { type: Number, min: 0 },
        pricePerDay: { type: Number, min: 0 },
      },
    ],
    route: {
      origin: { type: String },
      destination: { type: String },
      stops: { type: [String], default: [] },
      distanceKm: { type: Number, min: 0 },
      durationHours: { type: Number, min: 0 },
    },
    isInstantBook: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save slug generation
ListingSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true, locale: 'en' });
  }
  next();
});

// Indexes
ListingSchema.index({ slug: 1 }, { unique: true, name: 'idx_listing_slug' });
ListingSchema.index({ vendorId: 1, status: 1 }, { name: 'idx_listing_vendor_status' });
ListingSchema.index({ destinationId: 1, listingType: 1, status: 1 }, { name: 'idx_listing_dest_type_status' });
ListingSchema.index({ coordinates: '2dsphere' }, { name: 'idx_listing_geo' });
ListingSchema.index({ 'pricing.basePrice': 1 }, { name: 'idx_listing_price' });
ListingSchema.index({ rating: -1, reviewCount: -1 }, { name: 'idx_listing_popularity' });
ListingSchema.index({ bookingCount: -1 }, { name: 'idx_listing_bookings' });
ListingSchema.index({ amenities: 1 }, { name: 'idx_listing_amenities' });
ListingSchema.index({ tags: 1 }, { name: 'idx_listing_tags' });
ListingSchema.index({ listingType: 1, status: 1, isVerified: 1 }, { name: 'idx_listing_type_status_verified' });
ListingSchema.index({ isFeatured: 1, status: 1 }, { name: 'idx_listing_featured' });
ListingSchema.index({ wishlistCount: -1 }, { name: 'idx_listing_wishlist' });
ListingSchema.index({ createdAt: -1 }, { name: 'idx_listing_created' });

// Compound text index for basic search (Atlas Search will be primary)
ListingSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { name: 'idx_listing_text', weights: { title: 10, tags: 5, description: 2 } }
);

export const Listing: Model<IListingDocument> = mongoose.model<IListingDocument>('Listing', ListingSchema);
