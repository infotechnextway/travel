import { DestinationRepository } from './destination.repository';
import { Destination, IDestinationDocument } from './destination.model';
import { Listing } from '@modules/listings/listing.model';
import { NotFoundError, ValidationError, ConflictError } from '@shared/errors';
import slugify from 'slugify';

export interface DestinationHierarchyNode {
  _id: string;
  name: string;
  slug: string;
  type: string;
  children: DestinationHierarchyNode[];
}

export interface MapDestination {
  _id: string;
  name: string;
  slug: string;
  type: string;
  coordinates: [number, number];
  tags: string[];
  isFeatured: boolean;
  topExperiences: Array<{
    _id: string;
    title: string;
    listingType: string;
    rating: number;
    price: number;
  }>;
}

export class DestinationService {
  constructor(
    private destinationRepository: DestinationRepository,
  ) {}

  // CRUD operations
  async createDestination(dto: {
    name: string;
    slug?: string;
    type: string;
    parentId?: string;
    description: string;
    shortDescription?: string;
    images: string[];
    coverImage?: string;
    tags: string[];
    coordinates: { lat: number; lng: number };
    bestTimeToVisit: { months: string[]; notes?: string };
    weather?: {
      summer?: { temp: string; notes?: string };
      monsoon?: { temp: string; notes?: string };
      winter?: { temp: string; notes?: string };
    };
    safetyIndex: number;
    isFeatured: boolean;
    seo?: {
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
  }): Promise<IDestinationDocument> {
    // Validate parent exists for non-country types
    if (dto.type !== 'country' && dto.parentId) {
      const parent = await this.destinationRepository.findById(dto.parentId);
      if (!parent) {
        throw new ValidationError('Parent destination not found');
      }

      // Validate hierarchy
      const validHierarchy: Record<string, string> = {
        state: 'country',
        city: 'state',
        locality: 'city',
      };

      if (validHierarchy[dto.type] && parent.type !== validHierarchy[dto.type]) {
        throw new ValidationError(`Invalid hierarchy: ${dto.type} must be under ${validHierarchy[dto.type]}`);
      }
    }

    // Generate slug if not provided
    const slug = dto.slug || slugify(dto.name, { lower: true, strict: true, locale: 'en' });

    // Check slug uniqueness
    const existing = await this.destinationRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictError(`Destination with slug '${slug}' already exists`);
    }

    const destination = await this.destinationRepository.create({
      name: dto.name,
      slug,
      type: dto.type,
      parentId: dto.type === 'country' ? undefined : dto.parentId,
      description: dto.description,
      shortDescription: dto.shortDescription,
      images: dto.images || [],
      coverImage: dto.coverImage,
      tags: dto.tags || [],
      coordinates: {
        type: 'Point',
        coordinates: [dto.coordinates.lng, dto.coordinates.lat],
      },
      bestTimeToVisit: dto.bestTimeToVisit,
      weather: dto.weather,
      safetyIndex: dto.safetyIndex || 5,
      isFeatured: dto.isFeatured || false,
      seo: dto.seo,
      content: dto.content,
    });

    return destination;
  }

  async updateDestination(
    destinationId: string,
    dto: {
      name?: string;
      slug?: string;
      description?: string;
      shortDescription?: string;
      images?: string[];
      coverImage?: string;
      tags?: string[];
      coordinates?: { lat: number; lng: number };
      bestTimeToVisit?: { months: string[]; notes?: string };
      weather?: {
        summer?: { temp: string; notes?: string };
        monsoon?: { temp: string; notes?: string };
        winter?: { temp: string; notes?: string };
      };
      safetyIndex?: number;
      isFeatured?: boolean;
      seo?: {
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
    }
  ): Promise<IDestinationDocument> {
    const destination = await this.destinationRepository.findById(destinationId);
    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== destination.slug) {
      const existing = await this.destinationRepository.findBySlug(dto.slug);
      if (existing) {
        throw new ConflictError(`Destination with slug '${dto.slug}' already exists`);
      }
    }

    const updates: Record<string, unknown> = {};

    if (dto.name) updates.name = dto.name;
    if (dto.slug) updates.slug = dto.slug;
    if (dto.description) updates.description = dto.description;
    if (dto.shortDescription !== undefined) updates.shortDescription = dto.shortDescription;
    if (dto.images) updates.images = dto.images;
    if (dto.coverImage !== undefined) updates.coverImage = dto.coverImage;
    if (dto.tags) updates.tags = dto.tags;
    if (dto.coordinates) {
      updates.coordinates = {
        type: 'Point',
        coordinates: [dto.coordinates.lng, dto.coordinates.lat],
      };
    }
    if (dto.bestTimeToVisit) updates.bestTimeToVisit = dto.bestTimeToVisit;
    if (dto.weather) updates.weather = dto.weather;
    if (dto.safetyIndex !== undefined) updates.safetyIndex = dto.safetyIndex;
    if (dto.isFeatured !== undefined) updates.isFeatured = dto.isFeatured;
    if (dto.seo) updates.seo = dto.seo;
    if (dto.content) updates.content = dto.content;

    return this.destinationRepository.update(destinationId, updates) as Promise<IDestinationDocument>;
  }

  async deleteDestination(destinationId: string): Promise<void> {
    const destination = await this.destinationRepository.findById(destinationId);
    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    // Check for children
    const children = await this.destinationRepository.findByParentId(destinationId);
    if (children.length > 0) {
      throw new ValidationError('Cannot delete destination with child destinations. Please delete children first.');
    }

    // Check for associated listings
    const listings = await Listing.countDocuments({ destinationId }).exec();
    if (listings > 0) {
      throw new ValidationError(`Cannot delete destination with ${listings} associated listings. Please reassign or delete listings first.`);
    }

    await this.destinationRepository.delete(destinationId);
  }

  async getDestinationById(destinationId: string): Promise<IDestinationDocument> {
    const destination = await this.destinationRepository.findById(destinationId);
    if (!destination) {
      throw new NotFoundError('Destination not found');
    }
    return destination;
  }

  async getDestinationBySlug(slug: string): Promise<IDestinationDocument> {
    const destination = await this.destinationRepository.findBySlug(slug);
    if (!destination) {
      throw new NotFoundError('Destination not found');
    }
    return destination;
  }

  // Hierarchy
  async getHierarchy(rootId?: string): Promise<DestinationHierarchyNode[]> {
    const destinations = await this.destinationRepository.findHierarchy(rootId);

    // Build tree structure
    const buildTree = (parentId: string | null, level: number): DestinationHierarchyNode[] => {
      return destinations
        .filter((d: any) => {
          if (level === 0) return !d.parentId && d.level === 0;
          return d.parentId === parentId && d.level === level;
        })
        .map((d: any) => ({
          _id: d._id.toString(),
          name: d.name,
          slug: d.slug,
          type: d.type,
          children: buildTree(d._id.toString(), level + 1),
        }));
    };

    return buildTree(null, 0);
  }

  async getChildren(parentId: string, type?: string): Promise<IDestinationDocument[]> {
    return this.destinationRepository.findByParentId(parentId, type);
  }

  async getBreadcrumb(destinationId: string): Promise<IDestinationDocument[]> {
    return this.destinationRepository.getBreadcrumbPath(destinationId);
  }

  // Search & discovery
  async searchDestinations(filters: {
    type?: string;
    parentId?: string;
    tags?: string[];
    isFeatured?: boolean;
    search?: string;
    coordinates?: { lat: number; lng: number; radiusKm: number };
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
    sort: string;
    order: 'asc' | 'desc';
  }): Promise<{ destinations: IDestinationDocument[]; total: number; page: number; totalPages: number }> {
    return this.destinationRepository.searchDestinations(
      filters,
      filters.page,
      filters.limit,
      filters.sort,
      filters.order
    );
  }

  async getFeaturedDestinations(limit: number = 10): Promise<IDestinationDocument[]> {
    return this.destinationRepository.getFeaturedDestinations(limit);
  }

  async getNearbyDestinations(
    lat: number,
    lng: number,
    radiusKm: number = 50,
    limit: number = 20
  ): Promise<IDestinationDocument[]> {
    return this.destinationRepository.findNearby(lat, lng, radiusKm, limit);
  }

  // Content management
  async updateContent(
    destinationId: string,
    dto: {
      history?: string;
      culture?: string;
      cuisine?: string;
      howToReach?: string;
    }
  ): Promise<IDestinationDocument> {
    const destination = await this.destinationRepository.findById(destinationId);
    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    const content = {
      ...destination.content,
      ...dto,
    };

    return this.destinationRepository.update(destinationId, { content }) as Promise<IDestinationDocument>;
  }

  async updateWeather(
    destinationId: string,
    dto: {
      summer?: { temp: string; notes?: string };
      monsoon?: { temp: string; notes?: string };
      winter?: { temp: string; notes?: string };
    }
  ): Promise<IDestinationDocument> {
    const destination = await this.destinationRepository.findById(destinationId);
    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    const weather = {
      ...destination.weather,
      ...dto,
    };

    return this.destinationRepository.update(destinationId, { weather }) as Promise<IDestinationDocument>;
  }

  // Interactive map data
  async getMapData(
    type?: string,
    tags?: string[],
    isFeatured?: boolean
  ): Promise<MapDestination[]> {
    const query: any = {};
    if (type) query.type = type;
    if (tags && tags.length > 0) query.tags = { $in: tags };
    if (isFeatured !== undefined) query.isFeatured = isFeatured;

    const destinations = await Destination.find(query)
      .select('_id name slug type coordinates tags isFeatured')
      .exec();

    // Get top 3 experiences per destination
    const mapData: MapDestination[] = await Promise.all(
      destinations.map(async (dest) => {
        const listings = await Listing.find({
          destinationId: dest._id.toString(),
          status: 'published',
          isVerified: true,
        })
          .select('_id title listingType rating pricing.basePrice')
          .sort({ rating: -1, bookingCount: -1 })
          .limit(3)
          .exec();

        return {
          _id: dest._id.toString(),
          name: dest.name,
          slug: dest.slug,
          type: dest.type,
          coordinates: dest.coordinates.coordinates as [number, number],
          tags: dest.tags,
          isFeatured: dest.isFeatured,
          topExperiences: listings.map(l => ({
            _id: l._id.toString(),
            title: l.title,
            listingType: l.listingType,
            rating: l.rating,
            price: l.pricing.basePrice,
          })),
        };
      })
    );

    return mapData;
  }

  async getStateMapData(stateSlug: string): Promise<MapDestination[]> {
    const state = await this.destinationRepository.findBySlug(stateSlug);
    if (!state || state.type !== 'state') {
      throw new NotFoundError('State not found');
    }

    // Get cities and localities under this state
    const children = await this.destinationRepository.findByParentId(state._id.toString());
    const childIds = children.map(c => c._id.toString());

    // Get all destinations under this state (including nested)
    const allDestinations = await Destination.find({
      $or: [
        { parentId: state._id.toString() },
        { parentId: { $in: childIds } },
      ],
    }).select('_id name slug type coordinates tags isFeatured').exec();

    const mapData = await Promise.all(
      allDestinations.map(async (dest) => {
        const listings = await Listing.find({
          destinationId: dest._id.toString(),
          status: 'published',
          isVerified: true,
        })
          .select('_id title listingType rating pricing.basePrice')
          .sort({ rating: -1, bookingCount: -1 })
          .limit(3)
          .exec();

        return {
          _id: dest._id.toString(),
          name: dest.name,
          slug: dest.slug,
          type: dest.type,
          coordinates: dest.coordinates.coordinates as [number, number],
          tags: dest.tags,
          isFeatured: dest.isFeatured,
          topExperiences: listings.map(l => ({
            _id: l._id.toString(),
            title: l.title,
            listingType: l.listingType,
            rating: l.rating,
            price: l.pricing.basePrice,
          })),
        };
      })
    );

    return mapData;
  }

  // Admin operations
  async bulkAction(dto: {
    destinationIds: string[];
    action: 'feature' | 'unfeature' | 'activate' | 'deactivate';
  }): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const destinationId of dto.destinationIds) {
      try {
        const destination = await this.destinationRepository.findById(destinationId);
        if (!destination) {
          failed.push(destinationId);
          continue;
        }

        switch (dto.action) {
          case 'feature':
            await this.destinationRepository.update(destinationId, { isFeatured: true });
            break;
          case 'unfeature':
            await this.destinationRepository.update(destinationId, { isFeatured: false });
            break;
          case 'activate':
            // Destinations don't have isActive, but we could add it if needed
            break;
          case 'deactivate':
            // Same as above
            break;
        }

        success.push(destinationId);
      } catch {
        failed.push(destinationId);
      }
    }

    return { success, failed };
  }

  async getDestinationStats(): Promise<{
    totalDestinations: number;
    byType: Record<string, number>;
    featuredCount: number;
    withContent: number;
    withCoordinates: number;
  }> {
    return this.destinationRepository.getDestinationStats();
  }

  // Weather helper
  async getWeatherInfo(destinationId: string): Promise<{
    current: string;
    bestTime: string[];
    weather: any;
    safetyIndex: number;
  }> {
    const destination = await this.destinationRepository.findById(destinationId);
    if (!destination) {
      throw new NotFoundError('Destination not found');
    }

    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });

    let current = 'Pleasant';
    if (destination.weather) {
      if (['March', 'April', 'May', 'June'].includes(month) && destination.weather.summer) {
        current = destination.weather.summer.temp;
      } else if (['July', 'August', 'September'].includes(month) && destination.weather.monsoon) {
        current = destination.weather.monsoon.temp;
      } else if (['October', 'November', 'December', 'January', 'February'].includes(month) && destination.weather.winter) {
        current = destination.weather.winter.temp;
      }
    }

    return {
      current,
      bestTime: destination.bestTimeToVisit.months,
      weather: destination.weather,
      safetyIndex: destination.safetyIndex,
    };
  }
}
