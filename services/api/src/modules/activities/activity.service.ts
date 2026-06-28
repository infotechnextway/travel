import { Listing, IListingDocument } from '@modules/listings/listing.model';
import { Destination } from '@modules/destinations/destination.model';
import { Vendor } from '@modules/vendors/vendor.model';
import { Guide } from '@modules/guides/guide.model';
import { ListingType, ListingStatus } from '@shared/enums';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import slugify from 'slugify';

export interface ActivityFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  destinationId?: string;
  destinationSlug?: string;
  activityCategory?: string;
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
  weatherDependency?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: string;
  vendorId?: string;
}

export interface ActivitySearchResult {
  activities: IListingDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityPriceCalculation {
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

export class ActivityService {
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
    activityCategory: string;
    difficulty?: string;
    safetyBriefing: string;
    equipmentProvided?: string[];
    equipmentRequired?: string[];
    weatherDependency?: boolean;
    durationHours: number;
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

    const activity = await Listing.create({
      ...dto,
      vendorId,
      listingType: ListingType.ACTIVITY,
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

    return activity;
  }

  async getById(id: string): Promise<IListingDocument> {
    const activity = await Listing.findOne({ _id: id, listingType: ListingType.ACTIVITY })
      .populate('vendorId', 'businessName logo rating')
      .populate('guideIds', 'bio languages skills rating')
      .populate('destinationId', 'name slug type')
      .exec();

    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    return activity;
  }

  async getBySlug(slug: string): Promise<IListingDocument> {
    const activity = await Listing.findOne({ slug, listingType: ListingType.ACTIVITY, status: ListingStatus.PUBLISHED })
      .populate('vendorId', 'businessName logo rating')
      .populate('guideIds', 'bio languages skills rating')
      .populate('destinationId', 'name slug type')
      .exec();

    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    await Listing.updateOne({ _id: activity._id }, { $inc: { viewCount: 1 } });

    return activity;
  }

  async update(vendorId: string, activityId: string, dto: Record<string, unknown>): Promise<IListingDocument> {
    const activity = await Listing.findOne({ _id: activityId, vendorId, listingType: ListingType.ACTIVITY });
    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    if (activity.status === ListingStatus.ARCHIVED) {
      throw new ForbiddenError('Cannot update archived activities');
    }

    const updates: Record<string, unknown> = {};

    if (dto.title) {
      updates.title = dto.title;
      const newSlug = slugify(dto.title as string, { lower: true, strict: true, locale: 'en' });
      const existing = await Listing.findOne({ slug: newSlug, _id: { $ne: activityId } });
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
    if (dto.activityCategory) updates.activityCategory = dto.activityCategory;
    if (dto.difficulty) updates.difficulty = dto.difficulty;
    if (dto.safetyBriefing) updates.safetyBriefing = dto.safetyBriefing;
    if (dto.equipmentProvided !== undefined) updates.equipmentProvided = dto.equipmentProvided;
    if (dto.equipmentRequired !== undefined) updates.equipmentRequired = dto.equipmentRequired;
    if (dto.weatherDependency !== undefined) updates.weatherDependency = dto.weatherDependency;
    if (dto.durationHours) updates.durationHours = dto.durationHours;
    if (dto.minAge !== undefined) updates.minAge = dto.minAge;
    if (dto.maxAge !== undefined) updates.maxAge = dto.maxAge;
    if (dto.startTime !== undefined) updates.startTime = dto.startTime;
    if (dto.endTime !== undefined) updates.endTime = dto.endTime;
    if (dto.meetingPoint !== undefined) updates.meetingPoint = dto.meetingPoint;
    if (dto.dropOffPoint !== undefined) updates.dropOffPoint = dto.dropOffPoint;
    if (dto.isInstantBook !== undefined) updates.isInstantBook = dto.isInstantBook;
    if (dto.guideIds !== undefined) updates.guideIds = dto.guideIds;
    if (dto.status) updates.status = dto.status;

    const updated = await Listing.findByIdAndUpdate(activityId, updates, { new: true }).exec();
    if (!updated) {
      throw new NotFoundError('Activity not found');
    }

    return updated;
  }

  async delete(vendorId: string, activityId: string): Promise<void> {
    const activity = await Listing.findOne({ _id: activityId, vendorId, listingType: ListingType.ACTIVITY });
    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    await Listing.findByIdAndUpdate(activityId, { status: ListingStatus.ARCHIVED });
  }

  async search(filters: ActivityFilters): Promise<ActivitySearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sortField = filters.sort || 'createdAt';
    const order = filters.order === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {
      listingType: ListingType.ACTIVITY,
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

    if (filters.activityCategory) {
      query.activityCategory = filters.activityCategory;
    }

    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      query.durationHours = {};
      if (filters.minDuration !== undefined) {
        (query.durationHours as Record<string, number>).$gte = filters.minDuration;
      }
      if (filters.maxDuration !== undefined) {
        (query.durationHours as Record<string, number>).$lte = filters.maxDuration;
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

    if (filters.weatherDependency !== undefined) {
      query.weatherDependency = filters.weatherDependency;
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
        { safetyBriefing: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, number> = { [sortField]: order };

    const [activities, total] = await Promise.all([
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
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateAvailability(vendorId: string, activityId: string, availableDates: Array<{
    date: Date;
    slots: number;
    priceOverride?: number;
    isBlackout?: boolean;
  }>): Promise<IListingDocument> {
    const activity = await Listing.findOne({ _id: activityId, vendorId, listingType: ListingType.ACTIVITY });
    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    const updated = await Listing.findByIdAndUpdate(
      activityId,
      { 'inventory.availableDates': availableDates },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Activity not found');
    }

    return updated;
  }

  async calculatePrice(activityId: string, dto: {
    travelers: number;
    children?: number;
    infants?: number;
    date?: Date;
  }): Promise<ActivityPriceCalculation> {
    const activity = await Listing.findOne({ _id: activityId, listingType: ListingType.ACTIVITY });
    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    const pricing = activity.pricing;
    const adults = dto.travelers;
    const children = dto.children || 0;
    const infants = dto.infants || 0;
    const totalPax = adults + children;

    let adultPricePerPerson = pricing.pricePerPerson;
    if (pricing.groupSlabs && pricing.groupSlabs.length > 0) {
      const applicableSlab = pricing.groupSlabs.find(
        slab => totalPax >= slab.minPax && totalPax <= slab.maxPax
      );
      if (applicableSlab) {
        adultPricePerPerson = applicableSlab.pricePerPerson;
      }
    }

    let datePriceOverride = 0;
    if (dto.date && activity.inventory.availableDates) {
      const dateEntry = activity.inventory.availableDates.find(
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
    const groupDiscount = 0;
    const taxAmount = basePrice * (pricing.taxRate || 0.18);
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

  async getVendorActivities(vendorId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ActivitySearchResult> {
    return this.search({
      ...filters,
      vendorId,
      status: filters.status || 'published',
    });
  }

  async getSimilarActivities(activityId: string, limit: number = 5): Promise<IListingDocument[]> {
    const activity = await Listing.findById(activityId);
    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    return Listing.find({
      _id: { $ne: activityId },
      listingType: ListingType.ACTIVITY,
      status: ListingStatus.PUBLISHED,
      $or: [
        { destinationId: activity.destinationId },
        { tags: { $in: activity.tags } },
        { activityCategory: activity.activityCategory },
        { difficulty: activity.difficulty },
      ],
    })
      .limit(limit)
      .populate('vendorId', 'businessName logo rating')
      .populate('destinationId', 'name slug type')
      .exec();
  }

  async submitForReview(vendorId: string, activityId: string): Promise<IListingDocument> {
    const activity = await Listing.findOne({ _id: activityId, vendorId, listingType: ListingType.ACTIVITY });
    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    if (activity.status !== ListingStatus.DRAFT) {
      throw new ValidationError('Only draft activities can be submitted for review');
    }

    const updated = await Listing.findByIdAndUpdate(
      activityId,
      { status: ListingStatus.PENDING_REVIEW },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Activity not found');
    }

    return updated;
  }

  async checkWeatherSuitability(activityId: string, weatherData: {
    temperature: number;
    windSpeed: number;
    precipitation: number;
    visibility: number;
  }): Promise<{ suitable: boolean; reasons: string[] }> {
    const activity = await Listing.findOne({ _id: activityId, listingType: ListingType.ACTIVITY });
    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    if (!activity.weatherDependency) {
      return { suitable: true, reasons: ['Activity is not weather-dependent'] };
    }

    const reasons: string[] = [];
    let suitable = true;

    // Category-specific weather checks
    const categoryChecks: Record<string, Array<{ condition: boolean; reason: string }>> = {
      water_sports: [
        { condition: weatherData.windSpeed > 25, reason: 'Wind speed too high for water sports' },
        { condition: weatherData.precipitation > 10, reason: 'Heavy rain affecting visibility and safety' },
      ],
      air_sports: [
        { condition: weatherData.windSpeed > 20, reason: 'High wind speed unsafe for air sports' },
        { condition: weatherData.visibility < 5000, reason: 'Low visibility unsafe for air sports' },
      ],
      snow_sports: [
        { condition: weatherData.temperature > 5, reason: 'Temperature too high for snow conditions' },
        { condition: weatherData.precipitation > 5, reason: 'Heavy precipitation affecting snow quality' },
      ],
      trekking: [
        { condition: weatherData.precipitation > 15, reason: 'Heavy rain making trails slippery and dangerous' },
        { condition: weatherData.windSpeed > 30, reason: 'High winds dangerous at altitude' },
      ],
      motor_sports: [
        { condition: weatherData.precipitation > 10, reason: 'Wet conditions affecting traction' },
      ],
    };

    const checks = categoryChecks[activity.activityCategory as string] || [];
    for (const check of checks) {
      if (check.condition) {
        suitable = false;
        reasons.push(check.reason);
      }
    }

    if (suitable) {
      reasons.push('Weather conditions are suitable for this activity');
    }

    return { suitable, reasons };
  }
}
