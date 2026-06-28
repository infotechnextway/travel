import { UserRepository } from './user.repository';
import { IUserDocument } from './user.model';
import { KycStatus, UserRole } from '@shared/enums';
import { NotFoundError, ValidationError, ForbiddenError } from '@shared/errors';

export interface UserSearchFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  role?: string;
  kycStatus?: string;
  isActive?: boolean;
  isVerified?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  hasLoginAttempts?: boolean;
}

export interface UserSearchResult {
  users: IUserDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AdminUserService {
  constructor(private userRepository: UserRepository) {}

  async searchUsers(filters: UserSearchFilters): Promise<UserSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sortField = filters.sort || 'createdAt';
    const order = filters.order === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {};

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.kycStatus !== undefined) {
      query.kycStatus = filters.kycStatus;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    if (filters.hasLoginAttempts !== undefined) {
      if (filters.hasLoginAttempts) {
        query.loginAttempts = { $gt: 0 };
      } else {
        query.loginAttempts = { $eq: 0 };
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
        { email: searchRegex },
        { phone: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, number> = { [sortField]: order };

    const [users, total] = await Promise.all([
      this.userRepository.model
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('-passwordHash -twoFactorSecret')
        .exec(),
      this.userRepository.model.countDocuments(query).exec(),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string): Promise<IUserDocument> {
    const user = await this.userRepository.model
      .findById(userId)
      .select('-passwordHash -twoFactorSecret')
      .exec();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateUserStatus(
    userId: string,
    isActive: boolean,
    reason?: string
  ): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Cannot modify super admin status');
    }

    const updates: Record<string, unknown> = { isActive };

    if (!isActive) {
      updates.lockUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
    } else {
      updates.lockUntil = undefined;
      updates.loginAttempts = 0;
    }

    if (reason) {
      updates['metadata.suspensionReason'] = reason;
    }

    const updated = await this.userRepository.update(userId, updates);
    if (!updated) {
      throw new NotFoundError('User not found');
    }

    return this.userRepository.model
      .findById(userId)
      .select('-passwordHash -twoFactorSecret')
      .exec() as Promise<IUserDocument>;
  }

  async verifyKyc(userId: string, documentId: string, status: 'verified' | 'rejected', notes?: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const document = user.kycDocuments.find(
      (doc) => doc._id?.toString() === documentId
    );

    if (!document) {
      throw new NotFoundError('KYC document not found');
    }

    const docIndex = user.kycDocuments.findIndex(
      (doc) => doc._id?.toString() === documentId
    );

    user.kycDocuments[docIndex].status = status as KycStatus;
    if (status === 'verified') {
      user.kycDocuments[docIndex].verifiedAt = new Date();
    }

    // Check if all documents are verified
    const allVerified = user.kycDocuments.every(
      (doc) => doc.status === KycStatus.VERIFIED
    );
    const anyRejected = user.kycDocuments.some(
      (doc) => doc.status === KycStatus.REJECTED
    );

    if (allVerified && user.kycDocuments.length > 0) {
      user.kycStatus = KycStatus.VERIFIED;
    } else if (anyRejected) {
      user.kycStatus = KycStatus.REJECTED;
    } else {
      user.kycStatus = KycStatus.PENDING;
    }

    if (notes) {
      user.markModified('kycDocuments');
    }

    await user.save();

    return this.userRepository.model
      .findById(userId)
      .select('-passwordHash -twoFactorSecret')
      .exec() as Promise<IUserDocument>;
  }

  async getKycQueue(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: IUserDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const query: Record<string, unknown> = {
      'kycDocuments.0': { $exists: true },
    };

    if (filters.status) {
      query.kycStatus = filters.status;
    } else {
      query.kycStatus = { $in: [KycStatus.PENDING, KycStatus.REJECTED] };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userRepository.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-passwordHash -twoFactorSecret')
        .exec(),
      this.userRepository.model.countDocuments(query).exec(),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async bulkAction(dto: {
    userIds: string[];
    action: 'activate' | 'suspend' | 'verify_kyc' | 'reject_kyc';
    reason?: string;
  }): Promise<{ processed: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    for (const userId of dto.userIds) {
      try {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          errors.push(`User ${userId}: Not found`);
          failed++;
          continue;
        }

        if (user.role === UserRole.SUPER_ADMIN) {
          errors.push(`User ${userId}: Cannot modify super admin`);
          failed++;
          continue;
        }

        switch (dto.action) {
          case 'activate':
            await this.userRepository.update(userId, {
              isActive: true,
              lockUntil: undefined,
              loginAttempts: 0,
            });
            break;
          case 'suspend':
            await this.userRepository.update(userId, {
              isActive: false,
              lockUntil: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
            });
            break;
          case 'verify_kyc':
            user.kycStatus = KycStatus.VERIFIED;
            user.kycDocuments.forEach((doc) => {
              doc.status = KycStatus.VERIFIED;
              doc.verifiedAt = new Date();
            });
            await user.save();
            break;
          case 'reject_kyc':
            user.kycStatus = KycStatus.REJECTED;
            user.kycDocuments.forEach((doc) => {
              doc.status = KycStatus.REJECTED;
            });
            await user.save();
            break;
        }

        processed++;
      } catch (error) {
        errors.push(`User ${userId}: ${(error as Error).message}`);
        failed++;
      }
    }

    return { processed, failed, errors };
  }

  async getUserStats(): Promise<Record<string, unknown>> {
    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      totalGuides,
      totalAdmins,
      verifiedUsers,
      pendingKyc,
      rejectedKyc,
      activeUsers,
      suspendedUsers,
      recentSignups,
      lockedAccounts,
    ] = await Promise.all([
      this.userRepository.model.countDocuments().exec(),
      this.userRepository.model.countDocuments({ role: UserRole.CUSTOMER }).exec(),
      this.userRepository.model.countDocuments({ role: UserRole.VENDOR }).exec(),
      this.userRepository.model.countDocuments({ role: UserRole.GUIDE }).exec(),
      this.userRepository.model.countDocuments({ role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } }).exec(),
      this.userRepository.model.countDocuments({ isVerified: true }).exec(),
      this.userRepository.model.countDocuments({ kycStatus: KycStatus.PENDING }).exec(),
      this.userRepository.model.countDocuments({ kycStatus: KycStatus.REJECTED }).exec(),
      this.userRepository.model.countDocuments({ isActive: true }).exec(),
      this.userRepository.model.countDocuments({ isActive: false }).exec(),
      this.userRepository.model.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }).exec(),
      this.userRepository.model.countDocuments({
        $or: [
          { lockUntil: { $gt: new Date() } },
          { loginAttempts: { $gte: 5 } },
        ],
      }).exec(),
    ]);

    return {
      totalUsers,
      byRole: {
        customers: totalCustomers,
        vendors: totalVendors,
        guides: totalGuides,
        admins: totalAdmins,
      },
      verification: {
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
      },
      kyc: {
        pending: pendingKyc,
        verified: totalUsers - pendingKyc - rejectedKyc,
        rejected: rejectedKyc,
      },
      status: {
        active: activeUsers,
        suspended: suspendedUsers,
      },
      recentSignups,
      security: {
        lockedAccounts,
      },
    };
  }
}
