import { BaseRepository } from '@shared/repository';
import { User, IUserDocument } from './user.model';
import { FilterQuery, SortOrder } from 'mongoose';

export interface UserSearchFilters {
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  kycStatus?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasKycPending?: boolean;
}

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).select('+passwordHash').exec();
  }

  async findByPhone(phone: string): Promise<IUserDocument | null> {
    return this.model.findOne({ phone }).exec();
  }

  async findByPhoneWithPassword(phone: string): Promise<IUserDocument | null> {
    return this.model.findOne({ phone }).select('+passwordHash').exec();
  }

  async findByGoogleId(googleId: string): Promise<IUserDocument | null> {
    return this.model.findOne({ 'socialAccounts.google.id': googleId }).exec();
  }

  async findByAppleId(appleId: string): Promise<IUserDocument | null> {
    return this.model.findOne({ 'socialAccounts.apple.id': appleId }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const doc = await this.model.exists({ email: email.toLowerCase() }).exec();
    return !!doc;
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const doc = await this.model.exists({ phone }).exec();
    return !!doc;
  }

  async searchUsers(
    filters: UserSearchFilters,
    page: number = 1,
    limit: number = 20,
    sort: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<{ users: IUserDocument[]; total: number; page: number; totalPages: number }> {
    const query: FilterQuery<IUserDocument> = {};

    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;
    if (filters.kycStatus) query.kycStatus = filters.kycStatus;
    if (filters.hasKycPending) {
      query.kycStatus = 'pending';
      query['kycDocuments.0'] = { $exists: true };
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const sortOrder: { [key: string]: SortOrder } = {};
    sortOrder[sort] = order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.model.find(query).sort(sortOrder).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { users, total, page, totalPages };
  }

  async getKycQueue(
    page: number = 1,
    limit: number = 20,
    status: string = 'pending'
  ): Promise<{ users: IUserDocument[]; total: number; page: number; totalPages: number }> {
    const query: FilterQuery<IUserDocument> = {
      kycStatus: status,
      'kycDocuments.0': { $exists: true },
    };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.model.find(query)
        .sort({ kycSubmittedAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { users, total, page, totalPages };
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    byRole: Record<string, number>;
    byKycStatus: Record<string, number>;
    activeUsers: number;
    verifiedUsers: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      roleStats,
      kycStats,
      activeUsers,
      verifiedUsers,
      newToday,
      newThisWeek,
      newThisMonth,
    ] = await Promise.all([
      this.model.countDocuments().exec(),
      this.model.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]).exec(),
      this.model.aggregate([
        { $group: { _id: '$kycStatus', count: { $sum: 1 } } },
      ]).exec(),
      this.model.countDocuments({ isActive: true }).exec(),
      this.model.countDocuments({ isVerified: true }).exec(),
      this.model.countDocuments({ createdAt: { $gte: today } }).exec(),
      this.model.countDocuments({ createdAt: { $gte: weekAgo } }).exec(),
      this.model.countDocuments({ createdAt: { $gte: monthAgo } }).exec(),
    ]);

    const byRole: Record<string, number> = {};
    roleStats.forEach((s: any) => { byRole[s._id] = s.count; });

    const byKycStatus: Record<string, number> = {};
    kycStats.forEach((s: any) => { byKycStatus[s._id] = s.count; });

    return {
      totalUsers,
      byRole,
      byKycStatus,
      activeUsers,
      verifiedUsers,
      newToday,
      newThisWeek,
      newThisMonth,
    };
  }

  async findByIdWithFamily(userId: string): Promise<IUserDocument | null> {
    return this.model.findById(userId).select('+familyMembers').exec();
  }
}
