import { BaseRepository } from '@shared/repository';
import { Destination, IDestinationDocument } from './destination.model';
import { FilterQuery, SortOrder } from 'mongoose';

export interface DestinationSearchFilters {
  type?: string;
  parentId?: string;
  tags?: string[];
  isFeatured?: boolean;
  search?: string;
  coordinates?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
  dateFrom?: Date;
  dateTo?: Date;
}

export class DestinationRepository extends BaseRepository<IDestinationDocument> {
  constructor() {
    super(Destination);
  }

  async findBySlug(slug: string): Promise<IDestinationDocument | null> {
    return this.model.findOne({ slug: slug.toLowerCase() }).exec();
  }

  async findByParentId(parentId: string, type?: string): Promise<IDestinationDocument[]> {
    const query: FilterQuery<IDestinationDocument> = { parentId };
    if (type) query.type = type;
    return this.model.find(query).sort({ name: 1 }).exec();
  }

  async findHierarchy(rootId?: string): Promise<IDestinationDocument[]> {
    const match: FilterQuery<IDestinationDocument> = rootId ? { _id: rootId } : { type: 'country' };
    return this.model.aggregate([
      { $match: match },
      {
        $graphLookup: {
          from: 'destinations',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parentId',
          as: 'children',
          depthField: 'level',
        },
      },
    ]).exec();
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number,
    limit: number = 20
  ): Promise<IDestinationDocument[]> {
    return this.model.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(limit).exec();
  }

  async searchDestinations(
    filters: DestinationSearchFilters,
    page: number = 1,
    limit: number = 20,
    sort: string = 'name',
    order: 'asc' | 'desc' = 'asc'
  ): Promise<{ destinations: IDestinationDocument[]; total: number; page: number; totalPages: number }> {
    const query: FilterQuery<IDestinationDocument> = {};

    if (filters.type) query.type = filters.type;
    if (filters.parentId) query.parentId = filters.parentId;
    if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { 'content.history': searchRegex },
        { 'content.culture': searchRegex },
      ];
    }

    if (filters.coordinates) {
      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.coordinates.lng, filters.coordinates.lat],
          },
          $maxDistance: filters.coordinates.radiusKm * 1000,
        },
      };
    }

    const sortOrder: { [key: string]: SortOrder } = {};
    sortOrder[sort] = order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [destinations, total] = await Promise.all([
      this.model.find(query).sort(sortOrder).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { destinations, total, page, totalPages };
  }

  async getFeaturedDestinations(limit: number = 10): Promise<IDestinationDocument[]> {
    return this.model.find({ isFeatured: true })
      .sort({ 'seo.title': 1 })
      .limit(limit)
      .exec();
  }

  async getDestinationStats(): Promise<{
    totalDestinations: number;
    byType: Record<string, number>;
    featuredCount: number;
    withContent: number;
    withCoordinates: number;
  }> {
    const [
      totalDestinations,
      typeStats,
      featuredCount,
      withContent,
      withCoordinates,
    ] = await Promise.all([
      this.model.countDocuments().exec(),
      this.model.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]).exec(),
      this.model.countDocuments({ isFeatured: true }).exec(),
      this.model.countDocuments({
        $or: [
          { 'content.history': { $exists: true, $ne: '' } },
          { 'content.culture': { $exists: true, $ne: '' } },
          { 'content.cuisine': { $exists: true, $ne: '' } },
        ],
      }).exec(),
      this.model.countDocuments({ coordinates: { $exists: true } }).exec(),
    ]);

    const byType: Record<string, number> = {};
    typeStats.forEach((s: any) => { byType[s._id] = s.count; });

    return {
      totalDestinations,
      byType,
      featuredCount,
      withContent,
      withCoordinates,
    };
  }

  async getBreadcrumbPath(destinationId: string): Promise<IDestinationDocument[]> {
    const destination = await this.model.findById(destinationId).exec();
    if (!destination) return [];

    const breadcrumbs: IDestinationDocument[] = [destination];
    let current = destination;

    while (current.parentId) {
      const parent = await this.model.findById(current.parentId).exec();
      if (!parent) break;
      breadcrumbs.unshift(parent);
      current = parent;
    }

    return breadcrumbs;
  }
}
