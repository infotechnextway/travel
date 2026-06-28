import { BaseRepository } from '@shared/repository';
import { Guide, IGuideDocument } from './guide.model';
import { FilterQuery, SortOrder } from 'mongoose';

export interface GuideSearchFilters {
  skills?: string[];
  languages?: string[];
  minRating?: number;
  maxGroupSize?: number;
  isAvailable?: boolean;
  verificationStatus?: string;
  search?: string;
  destination?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class GuideRepository extends BaseRepository<IGuideDocument> {
  constructor() {
    super(Guide);
  }

  async findByUserId(userId: string): Promise<IGuideDocument | null> {
    return this.model.findOne({ userId }).exec();
  }

  async findAvailableGuides(
    filters: {
      skills?: string[];
      languages?: string[];
      minRating?: number;
      maxGroupSize?: number;
      destination?: string;
      date?: Date;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ guides: IGuideDocument[]; total: number; page: number; totalPages: number }> {
    const query: FilterQuery<IGuideDocument> = {
      isActive: true,
      verificationStatus: 'verified',
    };

    if (filters.skills && filters.skills.length > 0) {
      query.skills = { $in: filters.skills };
    }
    if (filters.languages && filters.languages.length > 0) {
      query.languages = { $in: filters.languages };
    }
    if (filters.minRating !== undefined) {
      query.rating = { $gte: filters.minRating };
    }
    if (filters.maxGroupSize !== undefined) {
      query.maxGroupSize = { $gte: filters.maxGroupSize };
    }
    if (filters.destination) {
      query.preferredDestinations = { $in: [filters.destination] };
    }

    if (filters.date) {
      query['availability'] = {
        $elemMatch: {
          date: filters.date,
          isAvailable: true,
        },
      };
    }

    const skip = (page - 1) * limit;

    const [guides, total] = await Promise.all([
      this.model.find(query).sort({ rating: -1, tripCount: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { guides, total, page, totalPages };
  }

  async searchGuides(
    filters: GuideSearchFilters,
    page: number = 1,
    limit: number = 20,
    sort: string = 'rating',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<{ guides: IGuideDocument[]; total: number; page: number; totalPages: number }> {
    const query: FilterQuery<IGuideDocument> = {};

    if (filters.skills && filters.skills.length > 0) {
      query.skills = { $in: filters.skills };
    }
    if (filters.languages && filters.languages.length > 0) {
      query.languages = { $in: filters.languages };
    }
    if (filters.minRating !== undefined) {
      query.rating = { $gte: filters.minRating };
    }
    if (filters.maxGroupSize !== undefined) {
      query.maxGroupSize = { $gte: filters.maxGroupSize };
    }
    if (filters.isAvailable !== undefined) {
      query.isActive = filters.isAvailable;
    }
    if (filters.verificationStatus) {
      query.verificationStatus = filters.verificationStatus;
    }
    if (filters.destination) {
      query.preferredDestinations = { $in: [filters.destination] };
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { bio: searchRegex },
        { skills: searchRegex },
        { languages: searchRegex },
      ];
    }

    const sortOrder: { [key: string]: SortOrder } = {};
    sortOrder[sort] = order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [guides, total] = await Promise.all([
      this.model.find(query).sort(sortOrder).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { guides, total, page, totalPages };
  }

  async getGuideStats(): Promise<{
    totalGuides: number;
    byVerificationStatus: Record<string, number>;
    bySkills: Record<string, number>;
    avgRating: number;
    totalTrips: number;
    totalEarnings: number;
    newThisMonth: number;
  }> {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalGuides,
      statusStats,
      skillsAgg,
      ratingAgg,
      totalTrips,
      totalEarnings,
      newThisMonth,
    ] = await Promise.all([
      this.model.countDocuments().exec(),
      this.model.aggregate([{ $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]).exec(),
      this.model.aggregate([
        { $unwind: '$skills' },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
      ]).exec(),
      this.model.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]).exec(),
      this.model.aggregate([{ $group: { _id: null, total: { $sum: '$tripCount' } } }]).exec(),
      this.model.aggregate([{ $group: { _id: null, total: { $sum: '$totalEarnings' } } }]).exec(),
      this.model.countDocuments({ createdAt: { $gte: monthAgo } }).exec(),
    ]);

    const byVerificationStatus: Record<string, number> = {};
    statusStats.forEach((s: any) => { byVerificationStatus[s._id] = s.count; });

    const bySkills: Record<string, number> = {};
    skillsAgg.forEach((s: any) => { bySkills[s._id] = s.count; });

    return {
      totalGuides,
      byVerificationStatus,
      bySkills,
      avgRating: ratingAgg[0]?.avg || 0,
      totalTrips: totalTrips[0]?.total || 0,
      totalEarnings: totalEarnings[0]?.total || 0,
      newThisMonth,
    };
  }

  async getPendingVerificationQueue(
    page: number = 1,
    limit: number = 20
  ): Promise<{ guides: IGuideDocument[]; total: number; page: number; totalPages: number }> {
    const query = {
      verificationStatus: { $in: ['submitted', 'under_review'] },
      isActive: true,
    };

    const skip = (page - 1) * limit;

    const [guides, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: 1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { guides, total, page, totalPages };
  }
}
