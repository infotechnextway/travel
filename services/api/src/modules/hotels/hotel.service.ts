import { Listing, IListingDocument } from '@modules/listings/listing.model';
import { Destination } from '@modules/destinations/destination.model';
import { Vendor } from '@modules/vendors/vendor.model';
import { Guide } from '@modules/guides/guide.model';
import { ListingType, ListingStatus } from '@shared/enums';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import slugify from 'slugify';

export interface HotelFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  destinationId?: string;
  destinationSlug?: string;
  propertyType?: string;
  starRating?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  languages?: string[];
  tags?: string[];
  isInstantBook?: boolean;
  isVerified?: boolean;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  search?: string;
  status?: string;
  vendorId?: string;
}

export interface HotelSearchResult {
  hotels: IListingDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HotelPriceCalculation {
  roomType: string;
  nights: number;
  basePrice: number;
  extraBedPrice: number;
  datePriceOverride: number;
  taxAmount: number;
  serviceFee: number;
  totalAmount: number;
  finalAmount: number;
  currency: string;
  breakdown: Array<{
    date: string;
    price: number;
    extraBedPrice: number;
  }>;
}

export class HotelService {
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
      taxRate?: number;
      serviceFee?: number;
      isNegotiable?: boolean;
    };
    inventory?: {
      maxCapacity?: number;
      minGroupSize?: number;
      maxGroupSize?: number;
      bookingCutoffHours?: number;
    };
    inclusions: string[];
    exclusions?: string[];
    amenities?: string[];
    tags?: string[];
    languagesOffered?: string[];
    cancellationPolicy?: string;
    propertyType: string;
    starRating?: number;
    checkInTime: string;
    checkOutTime: string;
    roomTypes: Array<{
      name: string;
      description?: string;
      maxOccupancy: number;
      bedConfiguration: string;
      sizeSqFt?: number;
      amenities?: string[];
      images?: string[];
      basePrice: number;
      extraBedPrice?: number;
      totalRooms: number;
    }>;
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

    const hotel = await Listing.create({
      ...dto,
      vendorId,
      listingType: ListingType.HOTEL,
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

    return hotel;
  }

  async getById(id: string): Promise<IListingDocument> {
    const hotel = await Listing.findOne({ _id: id, listingType: ListingType.HOTEL })
      .populate('vendorId', 'businessName logo rating')
      .populate('guideIds', 'bio languages skills rating')
      .populate('destinationId', 'name slug type')
      .exec();

    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    return hotel;
  }

  async getBySlug(slug: string): Promise<IListingDocument> {
    const hotel = await Listing.findOne({ slug, listingType: ListingType.HOTEL, status: ListingStatus.PUBLISHED })
      .populate('vendorId', 'businessName logo rating')
      .populate('guideIds', 'bio languages skills rating')
      .populate('destinationId', 'name slug type')
      .exec();

    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    await Listing.updateOne({ _id: hotel._id }, { $inc: { viewCount: 1 } });

    return hotel;
  }

  async update(vendorId: string, hotelId: string, dto: Record<string, unknown>): Promise<IListingDocument> {
    const hotel = await Listing.findOne({ _id: hotelId, vendorId, listingType: ListingType.HOTEL });
    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    if (hotel.status === ListingStatus.ARCHIVED) {
      throw new ForbiddenError('Cannot update archived hotels');
    }

    const updates: Record<string, unknown> = {};

    if (dto.title) {
      updates.title = dto.title;
      const newSlug = slugify(dto.title as string, { lower: true, strict: true, locale: 'en' });
      const existing = await Listing.findOne({ slug: newSlug, _id: { $ne: hotelId } });
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
    if (dto.propertyType) updates.propertyType = dto.propertyType;
    if (dto.starRating !== undefined) updates.starRating = dto.starRating;
    if (dto.checkInTime) updates.checkInTime = dto.checkInTime;
    if (dto.checkOutTime) updates.checkOutTime = dto.checkOutTime;
    if (dto.roomTypes) updates.roomTypes = dto.roomTypes;
    if (dto.isInstantBook !== undefined) updates.isInstantBook = dto.isInstantBook;
    if (dto.guideIds !== undefined) updates.guideIds = dto.guideIds;
    if (dto.status) updates.status = dto.status;

    const updated = await Listing.findByIdAndUpdate(hotelId, updates, { new: true }).exec();
    if (!updated) {
      throw new NotFoundError('Hotel not found');
    }

    return updated;
  }

  async delete(vendorId: string, hotelId: string): Promise<void> {
    const hotel = await Listing.findOne({ _id: hotelId, vendorId, listingType: ListingType.HOTEL });
    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    await Listing.findByIdAndUpdate(hotelId, { status: ListingStatus.ARCHIVED });
  }

  async search(filters: HotelFilters): Promise<HotelSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sortField = filters.sort || 'createdAt';
    const order = filters.order === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {
      listingType: ListingType.HOTEL,
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

    if (filters.propertyType) {
      query.propertyType = filters.propertyType;
    }

    if (filters.starRating) {
      query.starRating = filters.starRating;
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

    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $all: filters.amenities };
    }

    if (filters.languages && filters.languages.length > 0) {
      query.languagesOffered = { $in: filters.languages };
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
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

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { 'roomTypes.name': searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, number> = { [sortField]: order };

    const [hotels, total] = await Promise.all([
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
      hotels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRoomAvailability(vendorId: string, hotelId: string, roomTypeId: string, availability: Array<{
    date: Date;
    availableRooms: number;
    priceOverride?: number;
    isBlackout?: boolean;
  }>): Promise<IListingDocument> {
    const hotel = await Listing.findOne({ _id: hotelId, vendorId, listingType: ListingType.HOTEL });
    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    const roomTypeIndex = hotel.roomTypes?.findIndex((rt: any) => rt._id?.toString() === roomTypeId);
    if (roomTypeIndex === undefined || roomTypeIndex === -1) {
      throw new NotFoundError('Room type not found');
    }

    // Store availability in metadata for now - will be moved to dedicated collection in Phase 13
    const availabilityKey = `roomAvailability_${roomTypeId}`;
    const updates: Record<string, unknown> = {};
    updates[`metadata.${availabilityKey}`] = availability;

    const updated = await Listing.findByIdAndUpdate(hotelId, updates, { new: true }).exec();
    if (!updated) {
      throw new NotFoundError('Hotel not found');
    }

    return updated;
  }

  async calculatePrice(hotelId: string, dto: {
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children?: number;
    extraBeds?: number;
  }): Promise<HotelPriceCalculation> {
    const hotel = await Listing.findOne({ _id: hotelId, listingType: ListingType.HOTEL });
    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    const roomType = hotel.roomTypes?.find((rt: any) => rt._id?.toString() === dto.roomTypeId);
    if (!roomType) {
      throw new NotFoundError('Room type not found');
    }

    if (dto.adults > roomType.maxOccupancy) {
      throw new ValidationError(`Maximum occupancy for this room is ${roomType.maxOccupancy} adults`);
    }

    const nights = Math.ceil((new Date(dto.checkOut).getTime() - new Date(dto.checkIn).getTime()) / (1000 * 60 * 60 * 24));
    if (nights < 1) {
      throw new ValidationError('Minimum stay is 1 night');
    }

    const pricing = hotel.pricing;
    const basePricePerNight = roomType.basePrice;
    const extraBedPricePerNight = roomType.extraBedPrice || 0;

    const breakdown: Array<{ date: string; price: number; extraBedPrice: number }> = [];
    let totalBasePrice = 0;
    let totalExtraBedPrice = 0;
    let datePriceOverride = 0;

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(dto.checkIn);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      let nightPrice = basePricePerNight;

      // Check for date-specific price override in metadata
      const availabilityKey = `roomAvailability_${dto.roomTypeId}`;
      const availability = hotel.metadata?.[availabilityKey] as Array<{ date: string; priceOverride?: number }> | undefined;
      const dateEntry = availability?.find(a => new Date(a.date).toISOString().split('T')[0] === dateStr);

      if (dateEntry?.priceOverride) {
        datePriceOverride += dateEntry.priceOverride - basePricePerNight;
        nightPrice = dateEntry.priceOverride;
      }

      const nightExtraBedPrice = (dto.extraBeds || 0) * extraBedPricePerNight;

      totalBasePrice += nightPrice;
      totalExtraBedPrice += nightExtraBedPrice;

      breakdown.push({
        date: dateStr,
        price: nightPrice,
        extraBedPrice: nightExtraBedPrice,
      });
    }

    const taxAmount = totalBasePrice * (pricing.taxRate || 0.12);
    const serviceFee = pricing.serviceFee || 0;
    const totalAmount = totalBasePrice + totalExtraBedPrice + taxAmount + serviceFee;

    return {
      roomType: roomType.name,
      nights,
      basePrice: totalBasePrice,
      extraBedPrice: totalExtraBedPrice,
      datePriceOverride,
      taxAmount,
      serviceFee,
      totalAmount,
      finalAmount: totalAmount,
      currency: pricing.currency || 'INR',
      breakdown,
    };
  }

  async getVendorHotels(vendorId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<HotelSearchResult> {
    return this.search({
      ...filters,
      vendorId,
      status: filters.status || 'published',
    });
  }

  async getSimilarHotels(hotelId: string, limit: number = 5): Promise<IListingDocument[]> {
    const hotel = await Listing.findById(hotelId);
    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    return Listing.find({
      _id: { $ne: hotelId },
      listingType: ListingType.HOTEL,
      status: ListingStatus.PUBLISHED,
      $or: [
        { destinationId: hotel.destinationId },
        { tags: { $in: hotel.tags } },
        { propertyType: hotel.propertyType },
        { starRating: hotel.starRating },
      ],
    })
      .limit(limit)
      .populate('vendorId', 'businessName logo rating')
      .populate('destinationId', 'name slug type')
      .exec();
  }

  async submitForReview(vendorId: string, hotelId: string): Promise<IListingDocument> {
    const hotel = await Listing.findOne({ _id: hotelId, vendorId, listingType: ListingType.HOTEL });
    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    if (hotel.status !== ListingStatus.DRAFT) {
      throw new ValidationError('Only draft hotels can be submitted for review');
    }

    const updated = await Listing.findByIdAndUpdate(
      hotelId,
      { status: ListingStatus.PENDING_REVIEW },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Hotel not found');
    }

    return updated;
  }
}
