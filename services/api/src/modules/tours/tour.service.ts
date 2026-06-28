import { Listing, IListingDocument } from '@modules/listings/listing.model';
import { Destination } from '@modules/destinations/destination.model';
import { Vendor } from '@modules/vendors/vendor.model';
import { Guide } from '@modules/guides/guide.model';
import { ListingType, ListingStatus } from '@shared/enums';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import slugify from 'slugify';

export interface TourFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  destinationId?: string;
  destinationSlug?: string;
  difficulty?: string;
  minDuration?: number;
  maxDuration?: number;
  minPrice?: number;
  maxPrice?: number;
  minAge?: number;
  maxAge?: number;
  languages?: string[];
  tags?: string[];
  amenities?: string[];
  isInstantBook?: boolean;
  isVerified?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: string;
  vendorId?: string;
}

export interface TourSearchResult {
  tours: IListingDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PriceCalculation {
  basePrice: number;
  groupDiscount: number;
  datePriceOverride: number;
  childPrice: number;
  infantPrice: number;
  taxAmount: number;
  serviceFee: number;
  totalAmount: number;
  finalAmount: number;
  currency: string;
  breakdown: {
    adults: number;
    children: number;
    infants: number;
    adultPrice: number;
    childPricePerPerson: number;
    infantPricePerPerson: number;
  };
}

export class TourService {
  async create(vendorId: string, dto: {
    title: string;
    description: string;
    shortDescription?: string;
    destinationId: string;
    images: string[];
    videos?: string[];
    coordinates: [number, number];
    pricing: {
      basePrice: number;
      currency?: string;
      pricePerPerson: number;
      childPrice?: number;
      infantPrice?: number;
      groupSlabs?: Array<{ minPax: number; maxPax: number; pricePerPerson: number }>;
      taxRate?: number;
      serviceFee?: number;
      isNegotiable?: boolean;
    };
    inventory?: {
      maxCapacity?: number;
      minGroupSize?: number;
      maxGroupSize?: number;
      availableDates?: Array<{ date: Date; slots: number; priceOverride?: number; isBlackout?: boolean }>;
      bookingCutoffHours?: number;
    };
    inclusions: string[];
    exclusions?: string[];
    amenities?: string[];
    tags?: string[];
    languagesOffered?: string[];
    cancellationPolicy?: string;
    itinerary: Array<{
      day: number;
      title: string;
      description: string;
      activities?: string[];
      meals?: { breakfast?: boolean; lunch?: boolean; dinner?: boolean };
      accommodation?: string;
      transport?: string;
      images?: string[];
    }>;
    durationDays: number;
    durationHours?: number;
    difficulty?: string;
    minAge?: number;
    maxAge?: number;
    startTime?: string;
    endTime?: string;
    meetingPoint?: string;
    dropOffPoint?: string;
    isInstantBook?: boolean;
    guideIds?: string[];
  }): Promise<IListingDocument> {
    const destination = await Destination.findById(dto.destinationId);
    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }

    if (vendor.verificationStatus !== 'verified') {
      throw new ForbiddenError('Vendor must be verified to create listings');
    }

    const slug = slugify(dto.title, { lower: true, strict: true, locale: 'en' });
    const existingSlug = await Listing.findOne({ slug });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    if (dto.guideIds && dto.guideIds.length > 0) {
      const guides = await Guide.find({ _id: { $in: dto.guideIds } });
      if (guides.length !== dto.guideIds.length) {
        throw new ValidationError('Some guide IDs are invalid');
      }
    }

    const tour = await Listing.create({
      ...dto,
      vendorId,
      listingType: ListingType.TOUR,
      slug: finalSlug,
      coordinates: { type: 'Point', coordinates: dto.coordinates },
      status: ListingStatus.DRAFT,
      isVerified: false,
      rating: 0,
      reviewCount: 0,
      bookingCount: 0,
      viewCount: 0,
      wishlistCount: 0,
    });

    return tour;
  }

  async getById(id: string): Promise<IListingDocument> {
    const tour = await Listing.findOne({ _id: id, listingType: ListingType.TOUR })
      .populate('vendorId', 'businessName logo rating')
      .populate('guideIds', 'bio languages skills rating')
      .populate('destinationId', 'name slug type')
      .exec();

    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    return tour;
  }

  async getBySlug(slug: string): Promise<IListingDocument> {
    const tour = await Listing.findOne({ slug, listingType: ListingType.TOUR, status: ListingStatus.PUBLISHED })
      .populate('vendorId', 'businessName logo rating')
      .populate('guideIds', 'bio languages skills rating')
      .populate('destinationId', 'name slug type')
      .exec();

    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    // Increment view count
    await Listing.updateOne({ _id: tour._id }, { $inc: { viewCount: 1 } });

    return tour;
  }

  async update(vendorId: string, tourId: string, dto: Record<string, unknown>): Promise<IListingDocument> {
    const tour = await Listing.findOne({ _id: tourId, vendorId, listingType: ListingType.TOUR });
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    if (tour.status === ListingStatus.ARCHIVED) {
      throw new ForbiddenError('Cannot update archived tours');
    }

    const updates: Record<string, unknown> = {};

    if (dto.title) {
      updates.title = dto.title;
      const newSlug = slugify(dto.title as string, { lower: true, strict: true, locale: 'en' });
      const existing = await Listing.findOne({ slug: newSlug, _id: { $ne: tourId } });
      if (!existing) {
        updates.slug = newSlug;
      }
    }

    if (dto.description) updates.description = dto.description;
    if (dto.shortDescription !== undefined) updates.shortDescription = dto.shortDescription;
    if (dto.images) updates.images = dto.images;
    if (dto.videos !== undefined) updates.videos = dto.videos;
    if (dto.coordinates) updates.coordinates = { type: 'Point', coordinates: dto.coordinates };
    if (dto.pricing) updates.pricing = dto.pricing;
    if (dto.inventory) updates.inventory = dto.inventory;
    if (dto.inclusions) updates.inclusions = dto.inclusions;
    if (dto.exclusions !== undefined) updates.exclusions = dto.exclusions;
    if (dto.amenities !== undefined) updates.amenities = dto.amenities;
    if (dto.tags !== undefined) updates.tags = dto.tags;
    if (dto.languagesOffered) updates.languagesOffered = dto.languagesOffered;
    if (dto.cancellationPolicy) updates.cancellationPolicy = dto.cancellationPolicy;
    if (dto.itinerary) updates.itinerary = dto.itinerary;
    if (dto.durationDays) updates.durationDays = dto.durationDays;
    if (dto.durationHours !== undefined) updates.durationHours = dto.durationHours;
    if (dto.difficulty) updates.difficulty = dto.difficulty;
    if (dto.minAge !== undefined) updates.minAge = dto.minAge;
    if (dto.maxAge !== undefined) updates.maxAge = dto.maxAge;
    if (dto.startTime !== undefined) updates.startTime = dto.startTime;
    if (dto.endTime !== undefined) updates.endTime = dto.endTime;
    if (dto.meetingPoint !== undefined) updates.meetingPoint = dto.meetingPoint;
    if (dto.dropOffPoint !== undefined) updates.dropOffPoint = dto.dropOffPoint;
    if (dto.isInstantBook !== undefined) updates.isInstantBook = dto.isInstantBook;
    if (dto.guideIds !== undefined) updates.guideIds = dto.guideIds;
    if (dto.status) updates.status = dto.status;

    const updated = await Listing.findByIdAndUpdate(tourId, updates, { new: true }).exec();
    if (!updated) {
      throw new NotFoundError('Tour not found');
    }

    return updated;
  }

  async delete(vendorId: string, tourId: string): Promise<void> {
    const tour = await Listing.findOne({ _id: tourId, vendorId, listingType: ListingType.TOUR });
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    await Listing.findByIdAndUpdate(tourId, { status: ListingStatus.ARCHIVED });
  }

  async search(filters: TourFilters): Promise<TourSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sortField = filters.sort || 'createdAt';
    const order = filters.order === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {
      listingType: ListingType.TOUR,
    };

    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = ListingStatus.PUBLISHED;
    }

    if (filters.destinationId) {
      query.destinationId = filters.destinationId;
    }

    if (filters.destinationSlug) {
      const destination = await Destination.findOne({ slug: filters.destinationSlug });
      if (destination) {
        query.destinationId = destination._id;
      }
    }

    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      query.durationDays = {};
      if (filters.minDuration !== undefined) {
        (query.durationDays as Record<string, number>).$gte = filters.minDuration;
      }
      if (filters.maxDuration !== undefined) {
        (query.durationDays as Record<string, number>).$lte = filters.maxDuration;
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query['pricing.basePrice'] = {};
      if (filters.minPrice !== undefined) {
        (query['pricing.basePrice'] as Record<string, number>).$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        (query['pricing.basePrice'] as Record<string, number>).$lte = filters.maxPrice;
      }
    }

    if (filters.minAge !== undefined || filters.maxAge !== undefined) {
      query.minAge = {};
      if (filters.minAge !== undefined) {
        (query.minAge as Record<string, number>).$gte = filters.minAge;
      }
      if (filters.maxAge !== undefined) {
        query.maxAge = { $lte: filters.maxAge };
      }
    }

    if (filters.languages && filters.languages.length > 0) {
      query.languagesOffered = { $in: filters.languages };
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $all: filters.amenities };
    }

    if (filters.isInstantBook !== undefined) {
      query.isInstantBook = filters.isInstantBook;
    }

    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    if (filters.vendorId) {
      query.vendorId = filters.vendorId;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        (query.createdAt as Record<string, Date>).$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (query.createdAt as Record<string, Date>).$lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { 'itinerary.title': searchRegex },
        { 'itinerary.description': searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, number> = { [sortField]: order };

    const [tours, total] = await Promise.all([
      Listing.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('vendorId', 'businessName logo rating')
        .populate('destinationId', 'name slug type')
        .exec(),
      Listing.countDocuments(query).exec(),
    ]);

    return {
      tours,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateAvailability(vendorId: string, tourId: string, availableDates: Array<{
    date: Date;
    slots: number;
    priceOverride?: number;
    isBlackout?: boolean;
  }>): Promise<IListingDocument> {
    const tour = await Listing.findOne({ _id: tourId, vendorId, listingType: ListingType.TOUR });
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const updated = await Listing.findByIdAndUpdate(
      tourId,
      { 'inventory.availableDates': availableDates },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Tour not found');
    }

    return updated;
  }

  async calculatePrice(tourId: string, dto: {
    travelers: number;
    children?: number;
    infants?: number;
    date?: Date;
  }): Promise<PriceCalculation> {
    const tour = await Listing.findOne({ _id: tourId, listingType: ListingType.TOUR });
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    const pricing = tour.pricing;
    const adults = dto.travelers;
    const children = dto.children || 0;
    const infants = dto.infants || 0;
    const totalPax = adults + children;

    // Check group slabs for discount
    let adultPricePerPerson = pricing.pricePerPerson;
    if (pricing.groupSlabs && pricing.groupSlabs.length > 0) {
      const applicableSlab = pricing.groupSlabs.find(
        slab => totalPax >= slab.minPax && totalPax <= slab.maxPax
      );
      if (applicableSlab) {
        adultPricePerPerson = applicableSlab.pricePerPerson;
      }
    }

    // Check date-specific price override
    let datePriceOverride = 0;
    if (dto.date && tour.inventory.availableDates) {
      const dateEntry = tour.inventory.availableDates.find(
        d => new Date(d.date).toDateString() === new Date(dto.date!).toDateString()
      );
      if (dateEntry && dateEntry.priceOverride) {
        datePriceOverride = dateEntry.priceOverride - adultPricePerPerson;
        adultPricePerPerson = dateEntry.priceOverride;
      }
    }

    const adultTotal = adults * adultPricePerPerson;
    const childPricePerPerson = pricing.childPrice || 0;
    const infantPricePerPerson = pricing.infantPrice || 0;
    const childTotal = children * childPricePerPerson;
    const infantTotal = infants * infantPricePerPerson;

    const basePrice = adultTotal + childTotal + infantTotal;
    const groupDiscount = 0; // Calculated above via slabs
    const taxAmount = basePrice * (pricing.taxRate || 0.05);
    const serviceFee = pricing.serviceFee || 0;
    const totalAmount = basePrice + taxAmount + serviceFee;

    return {
      basePrice,
      groupDiscount,
      datePriceOverride,
      childPrice: childTotal,
      infantPrice: infantTotal,
      taxAmount,
      serviceFee,
      totalAmount,
      finalAmount: totalAmount,
      currency: pricing.currency || 'INR',
      breakdown: {
        adults,
        children,
        infants,
        adultPrice: adultPricePerPerson,
        childPricePerPerson,
        infantPricePerPerson,
      },
    };
  }

  async getVendorTours(vendorId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<TourSearchResult> {
    return this.search({
      ...filters,
      vendorId,
      status: filters.status || 'published',
    });
  }

  async getSimilarTours(tourId: string, limit: number = 5): Promise<IListingDocument[]> {
    const tour = await Listing.findById(tourId);
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    return Listing.find({
      _id: { $ne: tourId },
      listingType: ListingType.TOUR,
      status: ListingStatus.PUBLISHED,
      $or: [
        { destinationId: tour.destinationId },
        { tags: { $in: tour.tags } },
        { difficulty: tour.difficulty },
      ],
    })
      .limit(limit)
      .populate('vendorId', 'businessName logo rating')
      .populate('destinationId', 'name slug type')
      .exec();
  }

  async submitForReview(vendorId: string, tourId: string): Promise<IListingDocument> {
    const tour = await Listing.findOne({ _id: tourId, vendorId, listingType: ListingType.TOUR });
    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    if (tour.status !== ListingStatus.DRAFT) {
      throw new ValidationError('Only draft tours can be submitted for review');
    }

    const updated = await Listing.findByIdAndUpdate(
      tourId,
      { status: ListingStatus.PENDING_REVIEW },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Tour not found');
    }

    return updated;
  }
}
