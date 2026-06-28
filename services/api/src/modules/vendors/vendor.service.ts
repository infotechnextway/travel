import { VendorRepository } from './vendor.repository';
import { IVendorDocument } from './vendor.model';
import { UserRepository } from '@modules/users/user.repository';
import { VerificationStatus, UserRole } from '@shared/enums';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '@shared/errors';
import slugify from 'slugify';

export interface VendorProfileDto {
  businessName?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  socialLinks?: Record<string, string>;
}

export interface VendorSearchFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  verificationStatus?: string;
  businessType?: string;
  search?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface VendorSearchResult {
  vendors: IVendorDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VendorAnalytics {
  totalBookings: number;
  totalRevenue: number;
  totalListings: number;
  activeListings: number;
  averageRating: number;
  responseRate: number;
  responseTimeMinutes: number;
  conversionRate: number;
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
  bookingsByStatus: Record<string, number>;
  topListings: Array<{ listingId: string; title: string; bookings: number; revenue: number }>;
  recentReviews: Array<{ rating: number; comment: string; createdAt: Date }>;
}

export class VendorService {
  constructor(
    private vendorRepository: VendorRepository,
    private userRepository: UserRepository
  ) {}

  async onboard(userId: string, dto: {
    businessName: string;
    businessType: string;
    description?: string;
    gstin?: string;
    pan: string;
    registrationNumber?: string;
    contactEmail: string;
    contactPhone: string;
    website?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
  }): Promise<IVendorDocument> {
    const existing = await this.vendorRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictError('Vendor profile already exists for this user');
    }

    if (dto.gstin) {
      const gstinExists = await this.vendorRepository.findByGstin(dto.gstin);
      if (gstinExists) {
        throw new ConflictError('GSTIN already registered');
      }
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role !== UserRole.VENDOR && user.role !== UserRole.SUPER_ADMIN) {
      await this.userRepository.update(userId, { role: UserRole.VENDOR });
    }

    const slug = slugify(dto.businessName, { lower: true, strict: true, locale: 'en' });
    const slugExists = await this.vendorRepository.findBySlug(slug);
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const vendor = await this.vendorRepository.create({
      userId,
      businessName: dto.businessName,
      businessType: dto.businessType,
      description: dto.description,
      gstin: dto.gstin,
      pan: dto.pan,
      registrationNumber: dto.registrationNumber,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      website: dto.website,
      address: dto.address,
      slug: finalSlug,
      verificationStatus: VerificationStatus.SUBMITTED,
      commissionRate: 0.15,
      bankDetails: {
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountType: 'current',
      },
      payoutSchedule: 'monthly',
      rating: 0,
      totalBookings: 0,
      totalRevenue: 0,
      responseTimeMinutes: 0,
      responseRate: 0,
      isActive: true,
      documents: [],
    });

    return vendor;
  }

  async getProfile(userId: string): Promise<IVendorDocument> {
    const vendor = await this.vendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }
    return vendor;
  }

  async getProfileBySlug(slug: string): Promise<IVendorDocument> {
    const vendor = await this.vendorRepository.findBySlug(slug);
    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }
    return vendor;
  }

  async updateProfile(userId: string, dto: VendorProfileDto): Promise<IVendorDocument> {
    const vendor = await this.vendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    const updates: Record<string, unknown> = {};

    if (dto.businessName) {
      updates.businessName = dto.businessName;
      const newSlug = slugify(dto.businessName, { lower: true, strict: true, locale: 'en' });
      const slugExists = await this.vendorRepository.findBySlug(newSlug);
      if (!slugExists || slugExists._id === vendor._id) {
        updates.slug = newSlug;
      }
    }
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.contactEmail) updates.contactEmail = dto.contactEmail;
    if (dto.contactPhone) updates.contactPhone = dto.contactPhone;
    if (dto.website !== undefined) updates.website = dto.website;
    if (dto.logo) updates.logo = dto.logo;
    if (dto.coverImage) updates.coverImage = dto.coverImage;
    if (dto.socialLinks) updates.socialLinks = dto.socialLinks;

    const updated = await this.vendorRepository.update(vendor._id, updates);
    if (!updated) {
      throw new NotFoundError('Vendor not found');
    }
    return updated;
  }

  async updateBankDetails(userId: string, dto: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
    accountType: 'savings' | 'current';
  }): Promise<IVendorDocument> {
    const vendor = await this.vendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    const updated = await this.vendorRepository.update(vendor._id, {
      bankDetails: dto,
    });

    if (!updated) {
      throw new NotFoundError('Vendor not found');
    }

    return updated;
  }

  async updatePayoutSchedule(userId: string, payoutSchedule: 'weekly' | 'biweekly' | 'monthly'): Promise<IVendorDocument> {
    const vendor = await this.vendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    const updated = await this.vendorRepository.update(vendor._id, { payoutSchedule });
    if (!updated) {
      throw new NotFoundError('Vendor not found');
    }

    return updated;
  }

  async uploadDocument(userId: string, dto: { type: string; url: string }): Promise<IVendorDocument> {
    const vendor = await this.vendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    const document = {
      type: dto.type,
      url: dto.url,
      verifiedAt: undefined,
    };

    const updated = await this.vendorRepository.model.findByIdAndUpdate(
      vendor._id,
      { $push: { documents: document } },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Vendor not found');
    }

    return updated;
  }

  async getDashboard(userId: string): Promise<IVendorDocument & { analytics: VendorAnalytics }> {
    const vendor = await this.vendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    // Placeholder analytics - will be populated with real aggregation queries in Phase 12
    const analytics: VendorAnalytics = {
      totalBookings: vendor.totalBookings,
      totalRevenue: vendor.totalRevenue,
      totalListings: 0,
      activeListings: 0,
      averageRating: vendor.rating,
      responseRate: vendor.responseRate,
      responseTimeMinutes: vendor.responseTimeMinutes,
      conversionRate: 0,
      monthlyRevenue: [],
      bookingsByStatus: {},
      topListings: [],
      recentReviews: [],
    };

    return { ...vendor.toObject(), analytics } as IVendorDocument & { analytics: VendorAnalytics };
  }

  async searchVendors(filters: VendorSearchFilters): Promise<VendorSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sortField = filters.sort || 'createdAt';
    const order = filters.order === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {};

    if (filters.verificationStatus) {
      query.verificationStatus = filters.verificationStatus;
    }

    if (filters.businessType) {
      query.businessType = filters.businessType;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
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
        { businessName: searchRegex },
        { contactEmail: searchRegex },
        { contactPhone: searchRegex },
        { gstin: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, number> = { [sortField]: order };

    const [vendors, total] = await Promise.all([
      this.vendorRepository.model
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.vendorRepository.model.countDocuments(query).exec(),
    ]);

    return {
      vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getVendorStats(): Promise<Record<string, unknown>> {
    const [
      totalVendors,
      verifiedVendors,
      pendingVendors,
      rejectedVendors,
      activeVendors,
      suspendedVendors,
      totalRevenue,
      totalBookings,
      byBusinessType,
    ] = await Promise.all([
      this.vendorRepository.model.countDocuments().exec(),
      this.vendorRepository.model.countDocuments({ verificationStatus: VerificationStatus.VERIFIED }).exec(),
      this.vendorRepository.model.countDocuments({ verificationStatus: VerificationStatus.SUBMITTED }).exec(),
      this.vendorRepository.model.countDocuments({ verificationStatus: VerificationStatus.REJECTED }).exec(),
      this.vendorRepository.model.countDocuments({ isActive: true }).exec(),
      this.vendorRepository.model.countDocuments({ isActive: false }).exec(),
      this.vendorRepository.model.aggregate([{ $group: { _id: null, total: { $sum: '$totalRevenue' } } }]).exec(),
      this.vendorRepository.model.aggregate([{ $group: { _id: null, total: { $sum: '$totalBookings' } } }]).exec(),
      this.vendorRepository.model.aggregate([
        { $group: { _id: '$businessType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).exec(),
    ]);

    return {
      totalVendors,
      verification: {
        verified: verifiedVendors,
        pending: pendingVendors,
        rejected: rejectedVendors,
        draft: totalVendors - verifiedVendors - pendingVendors - rejectedVendors,
      },
      status: {
        active: activeVendors,
        suspended: suspendedVendors,
      },
      financial: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalBookings: totalBookings[0]?.total || 0,
      },
      byBusinessType: byBusinessType.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async updateVerificationStatus(
    adminUserId: string,
    vendorId: string,
    status: VerificationStatus,
    notes?: string
  ): Promise<IVendorDocument> {
    const vendor = await this.vendorRepository.findById(vendorId);
    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }

    const updates: Record<string, unknown> = {
      verificationStatus: status,
    };

    if (notes) {
      updates['metadata.verificationNotes'] = notes;
      updates['metadata.verifiedBy'] = adminUserId;
      updates['metadata.verifiedAt'] = new Date();
    }

    if (status === VerificationStatus.VERIFIED) {
      updates.isActive = true;
    } else if (status === VerificationStatus.REJECTED || status === VerificationStatus.SUSPENDED) {
      updates.isActive = false;
    }

    const updated = await this.vendorRepository.update(vendorId, updates);
    if (!updated) {
      throw new NotFoundError('Vendor not found');
    }

    return updated;
  }
}
