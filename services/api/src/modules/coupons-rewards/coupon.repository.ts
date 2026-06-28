import { FilterQuery, SortOrder } from 'mongoose';
import { CouponModel, ICoupon } from './coupon.model';
import { CouponRedemptionModel, ICouponRedemption } from './coupon-redemption.model';
import { BaseRepository } from '@shared/repository';

export class CouponRepository extends BaseRepository<ICoupon> {
  constructor() {
    super(CouponModel);
  }

  async findByCode(code: string): Promise<ICoupon | null> {
    return this.model.findOne({ code: code.toUpperCase().trim() }).lean();
  }

  async findActiveByListing(listingId: string, listingType: string, vendorId: string): Promise<ICoupon[]> {
    const now = new Date();
    return this.model.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      usedCount: { $lt: { $expr: '$usageLimitTotal' } },
      $or: [
        { type: 'global' },
        { vendorId },
        { applicableVendorIds: vendorId },
        { applicableListingIds: listingId }
      ],
      $or: [
        { applicableListingTypes: { $size: 0 } },
        { applicableListingTypes: listingType }
      ],
      excludedListingIds: { $ne: listingId }
    }).lean();
  }

  async searchCoupons(
    filters: {
      type?: string;
      vendorId?: string;
      isActive?: boolean;
      discountType?: string;
      search?: string;
      startDateFrom?: Date;
      startDateTo?: Date;
    },
    page: number = 1,
    limit: number = 20,
    sort: { [key: string]: SortOrder } = { createdAt: -1 }
  ): Promise<{ coupons: ICoupon[]; total: number }> {
    const query: FilterQuery<ICoupon> = {};
    if (filters.type) query.type = filters.type;
    if (filters.vendorId) query.vendorId = filters.vendorId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.discountType) query.discountType = filters.discountType;
    if (filters.search) {
      query.$or = [
        { code: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    if (filters.startDateFrom || filters.startDateTo) {
      query.startDate = {};
      if (filters.startDateFrom) query.startDate.$gte = filters.startDateFrom;
      if (filters.startDateTo) query.startDate.$lte = filters.startDateTo;
    }

    const [coupons, total] = await Promise.all([
      this.model.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { coupons, total };
  }

  async incrementUsage(couponId: string): Promise<void> {
    await this.model.updateOne({ _id: couponId }, { $inc: { usedCount: 1 } });
  }

  async getUserRedemptionCount(couponId: string, userId: string): Promise<number> {
    return CouponRedemptionModel.countDocuments({ couponId, userId });
  }

  async getRedemptionsByCoupon(couponId: string, page: number = 1, limit: number = 20): Promise<{ redemptions: ICouponRedemption[]; total: number }> {
    const [redemptions, total] = await Promise.all([
      CouponRedemptionModel.find({ couponId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CouponRedemptionModel.countDocuments({ couponId })
    ]);
    return { redemptions, total };
  }

  async createRedemption(data: Partial<ICouponRedemption>): Promise<ICouponRedemption> {
    return CouponRedemptionModel.create(data);
  }

  async getCouponStats(couponId: string): Promise<any> {
    const [redemptionCount, totalDiscount, uniqueUsers] = await Promise.all([
      CouponRedemptionModel.countDocuments({ couponId }),
      CouponRedemptionModel.aggregate([
        { $match: { couponId } },
        { $group: { _id: null, total: { $sum: '$discountAmount' } } }
      ]),
      CouponRedemptionModel.distinct('userId', { couponId })
    ]);

    return {
      redemptionCount,
      totalDiscount: totalDiscount[0]?.total || 0,
      uniqueUsers: uniqueUsers.length
    };
  }
}
