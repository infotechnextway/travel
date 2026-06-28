import { Listing, IListingDocument } from '@modules/listings/listing.model';
import { Destination } from '@modules/destinations/destination.model';
import { Vendor } from '@modules/vendors/vendor.model';
import { Guide } from '@modules/guides/guide.model';
import { ListingType, ListingStatus } from '@shared/enums';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import slugify from 'slugify';

export interface TransportFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  destinationId?: string;
  destinationSlug?: string;
  transportType?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  maxCapacity?: number;
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
  origin?: string;
  destination?: string;
}

export interface TransportSearchResult {
  transports: IListingDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransportPriceCalculation {
  basePrice: number;
  distancePrice: number;
  dailyPrice: number;
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
    distanceKm: number;
    days: number;
    selectedVehicle: string;
  };
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export class TransportService {
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
    transportType: string;
    fleetDetails: Array<{
      vehicleType: string;
      capacity: number;
      features?: string[];
      pricePerKm?: number;
      pricePerDay?: number;
      images?: string[];
      registrationNumber?: string;
      insuranceValidUntil?: Date;
      lastServiceDate?: Date;
      nextServiceDue?: Date;
      isActive?: boolean;
    }>;
    route: {
      origin: string;
      destination: string;
      stops?: string[];
      distanceKm?: number;
      durationHours?: number;
      routeDescription?: string;
      waypoints?: Array<{
        name: string;
        coordinates: [number, number];
        stopDuration?: number;
      }>;
    };
    operatorDetails?: {
      operatorName: string;
      operatorContact: string;
      operatorEmail: string;
      licenseNumber?: string;
      licenseValidUntil?: Date;
      yearsOfExperience?: number;
      safetyRating?: number;
    };
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

    // Validate fleet pricing
    for (const fleet of dto.fleetDetails) {
      if (!fleet.pricePerKm && !fleet.pricePerDay) {
        throw new ValidationError(`Fleet vehicle ${fleet.vehicleType} must have either pricePerKm or pricePerDay`);
      }
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

    const transport = await Listing.create({
      ...dto,
      vendorId,
      listingType: ListingType.TRANSPORT,
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

    return transport;
  }

  async getById(id: string): Promise<IListingDocument> {
    const transport = await Listing.findOne({ _id: id, listingType: ListingType.TRANSPORT })
      .populate('vendorId', 'businessName logo rating')
      .populate('guideIds', 'bio languages skills rating')
      .populate('destinationId', 'name slug type')
      .exec();

    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    return transport;
  }

  async getBySlug(slug: string): Promise<IListingDocument> {
    const transport = await Listing.findOne({ slug, listingType: ListingType.TRANSPORT, status: ListingStatus.PUBLISHED })
      .populate('vendorId', 'businessName logo rating')
      .populate('guideIds', 'bio languages skills rating')
      .populate('destinationId', 'name slug type')
      .exec();

    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    await Listing.updateOne({ _id: transport._id }, { $inc: { viewCount: 1 } });

    return transport;
  }

  async update(vendorId: string, transportId: string, dto: Record<string, unknown>): Promise<IListingDocument> {
    const transport = await Listing.findOne({ _id: transportId, vendorId, listingType: ListingType.TRANSPORT });
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    if (transport.status === ListingStatus.ARCHIVED) {
      throw new ForbiddenError('Cannot update archived transports');
    }

    const updates: Record<string, unknown> = {};

    if (dto.title) {
      updates.title = dto.title;
      const newSlug = slugify(dto.title as string, { lower: true, strict: true, locale: 'en' });
      const existing = await Listing.findOne({ slug: newSlug, _id: { $ne: transportId } });
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
    if (dto.transportType) updates.transportType = dto.transportType;
    if (dto.fleetDetails) {
      // Validate fleet pricing on update
      const fleetDetails = dto.fleetDetails as Array<{ pricePerKm?: number; pricePerDay?: number; vehicleType: string }>;
      for (const fleet of fleetDetails) {
        if (!fleet.pricePerKm && !fleet.pricePerDay) {
          throw new ValidationError(`Fleet vehicle ${fleet.vehicleType} must have either pricePerKm or pricePerDay`);
        }
      }
      updates.fleetDetails = dto.fleetDetails;
    }
    if (dto.route) updates.route = dto.route;
    if (dto.operatorDetails) updates.operatorDetails = dto.operatorDetails;
    if (dto.isInstantBook !== undefined) updates.isInstantBook = dto.isInstantBook;
    if (dto.guideIds !== undefined) updates.guideIds = dto.guideIds;
    if (dto.status) updates.status = dto.status;

    const updated = await Listing.findByIdAndUpdate(transportId, updates, { new: true }).exec();
    if (!updated) {
      throw new NotFoundError('Transport not found');
    }

    return updated;
  }

  async delete(vendorId: string, transportId: string): Promise<void> {
    const transport = await Listing.findOne({ _id: transportId, vendorId, listingType: ListingType.TRANSPORT });
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    await Listing.findByIdAndUpdate(transportId, { status: ListingStatus.ARCHIVED });
  }

  async search(filters: TransportFilters): Promise<TransportSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sortField = filters.sort || 'createdAt';
    const order = filters.order === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {
      listingType: ListingType.TRANSPORT,
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

    if (filters.transportType) {
      query.transportType = filters.transportType;
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

    if (filters.minCapacity !== undefined || filters.maxCapacity !== undefined) {
      query['fleetDetails.capacity'] = {};
      if (filters.minCapacity !== undefined) {
        (query['fleetDetails.capacity'] as Record<string, number>).$gte = filters.minCapacity;
      }
      if (filters.maxCapacity !== undefined) {
        (query['fleetDetails.capacity'] as Record<string, number>).$lte = filters.maxCapacity;
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

    if (filters.origin || filters.destination) {
      query.$or = [];
      if (filters.origin) {
        (query.$or as Array<Record<string, unknown>>).push({ 'route.origin': new RegExp(filters.origin, 'i') });
      }
      if (filters.destination) {
        (query.$or as Array<Record<string, unknown>>).push({ 'route.destination': new RegExp(filters.destination, 'i') });
      }
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
        { 'route.origin': searchRegex },
        { 'route.destination': searchRegex },
        { 'route.stops': searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, number> = { [sortField]: order };

    const [transports, total] = await Promise.all([
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
      transports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async calculatePrice(transportId: string, dto: {
    travelers: number;
    children?: number;
    infants?: number;
    distanceKm?: number;
    days?: number;
    fleetVehicleIndex?: number;
  }): Promise<TransportPriceCalculation> {
    const transport = await Listing.findOne({ _id: transportId, listingType: ListingType.TRANSPORT });
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    const pricing = transport.pricing;
    const adults = dto.travelers;
    const children = dto.children || 0;
    const infants = dto.infants || 0;
    const days = dto.days || 1;
    const distanceKm = dto.distanceKm || transport.route?.distanceKm || 0;

    // Select fleet vehicle
    const fleetIndex = dto.fleetVehicleIndex || 0;
    const fleet = transport.fleetDetails?.[fleetIndex];
    if (!fleet) {
      throw new NotFoundError('Fleet vehicle not found');
    }

    if (adults > fleet.capacity) {
      throw new ValidationError(`Selected vehicle capacity (${fleet.capacity}) is less than requested travelers (${adults})`);
    }

    let distancePrice = 0;
    let dailyPrice = 0;

    if (fleet.pricePerKm && distanceKm > 0) {
      distancePrice = fleet.pricePerKm * distanceKm;
    }

    if (fleet.pricePerDay && days > 0) {
      dailyPrice = fleet.pricePerDay * days;
    }

    const adultPricePerPerson = pricing.pricePerPerson;
    const adultTotal = adults * adultPricePerPerson;
    const childPricePerPerson = pricing.childPrice || 0;
    const infantPricePerPerson = pricing.infantPrice || 0;
    const childTotal = children * childPricePerPerson;
    const infantTotal = infants * infantPricePerPerson;

    const basePrice = adultTotal + childTotal + infantTotal + distancePrice + dailyPrice;
    const taxAmount = basePrice * (pricing.taxRate || 0.10);
    const serviceFee = pricing.serviceFee || 0;
    const totalAmount = basePrice + taxAmount + serviceFee;

    return {
      basePrice,
      distancePrice,
      dailyPrice,
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
        distanceKm,
        days,
        selectedVehicle: fleet.vehicleType,
      },
    };
  }

  async updateFleetStatus(vendorId: string, transportId: string, fleetIndex: number, isActive: boolean, reason?: string): Promise<IListingDocument> {
    const transport = await Listing.findOne({ _id: transportId, vendorId, listingType: ListingType.TRANSPORT });
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    const fleetDetails = transport.fleetDetails || [];
    if (fleetIndex >= fleetDetails.length) {
      throw new NotFoundError('Fleet vehicle not found');
    }

    fleetDetails[fleetIndex].isActive = isActive;

    const updated = await Listing.findByIdAndUpdate(
      transportId,
      {
        fleetDetails,
        [`metadata.fleetStatus_${fleetIndex}`]: {
          isActive,
          reason,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Transport not found');
    }

    return updated;
  }

  async updateLocation(transportId: string, location: LocationUpdate): Promise<void> {
    const transport = await Listing.findOne({ _id: transportId, listingType: ListingType.TRANSPORT });
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    // Store location in metadata - will be moved to dedicated tracking collection in Phase 13
    await Listing.findByIdAndUpdate(transportId, {
      $push: {
        'metadata.locationHistory': {
          $each: [location],
          $slice: -100, // Keep last 100 locations
        },
      },
      'metadata.lastLocation': location,
    });
  }

  async getLocationHistory(transportId: string, limit: number = 100): Promise<LocationUpdate[]> {
    const transport = await Listing.findOne({ _id: transportId, listingType: ListingType.TRANSPORT });
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    return (transport.metadata?.locationHistory as LocationUpdate[] || []).slice(-limit);
  }

  async getVendorTransports(vendorId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<TransportSearchResult> {
    return this.search({
      ...filters,
      vendorId,
      status: filters.status || 'published',
    });
  }

  async getSimilarTransports(transportId: string, limit: number = 5): Promise<IListingDocument[]> {
    const transport = await Listing.findById(transportId);
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    return Listing.find({
      _id: { $ne: transportId },
      listingType: ListingType.TRANSPORT,
      status: ListingStatus.PUBLISHED,
      $or: [
        { destinationId: transport.destinationId },
        { tags: { $in: transport.tags } },
        { transportType: transport.transportType },
        { 'route.origin': transport.route?.origin },
        { 'route.destination': transport.route?.destination },
      ],
    })
      .limit(limit)
      .populate('vendorId', 'businessName logo rating')
      .populate('destinationId', 'name slug type')
      .exec();
  }

  async submitForReview(vendorId: string, transportId: string): Promise<IListingDocument> {
    const transport = await Listing.findOne({ _id: transportId, vendorId, listingType: ListingType.TRANSPORT });
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    if (transport.status !== ListingStatus.DRAFT) {
      throw new ValidationError('Only draft transports can be submitted for review');
    }

    const updated = await Listing.findByIdAndUpdate(
      transportId,
      { status: ListingStatus.PENDING_REVIEW },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Transport not found');
    }

    return updated;
  }

  async getFleetUtilization(vendorId: string, transportId: string): Promise<{
    totalVehicles: number;
    activeVehicles: number;
    inactiveVehicles: number;
    utilizationRate: number;
    fleetDetails: Array<{
      vehicleType: string;
      capacity: number;
      isActive: boolean;
      bookingCount: number;
    }>;
  }> {
    const transport = await Listing.findOne({ _id: transportId, vendorId, listingType: ListingType.TRANSPORT });
    if (!transport) {
      throw new NotFoundError('Transport not found');
    }

    const fleetDetails = transport.fleetDetails || [];
    const totalVehicles = fleetDetails.length;
    const activeVehicles = fleetDetails.filter((f: any) => f.isActive !== false).length;
    const inactiveVehicles = totalVehicles - activeVehicles;
    const utilizationRate = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

    return {
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      fleetDetails: fleetDetails.map((f: any) => ({
        vehicleType: f.vehicleType,
        capacity: f.capacity,
        isActive: f.isActive !== false,
        bookingCount: f.bookingCount || 0,
      })),
    };
  }
}
