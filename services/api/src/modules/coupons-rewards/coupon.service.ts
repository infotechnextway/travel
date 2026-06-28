import { CouponRepository } from './coupon.repository';
import { ICoupon } from './coupon.model';
import { BookingRepository } from '@modules/bookings/booking.repository';
import { UserRepository } from '@modules/users/user.repository';
import { AppError, NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import { UserRole } from '@shared/enums';

export class CouponService {
  constructor(
    private couponRepo: CouponRepository,
    private bookingRepo: BookingRepository,
    private userRepo: UserRepository
  ) {}

  // ─── COUPON CRUD ───

  async createCoupon(adminId: string, dto: any): Promise<ICoupon> {
    const existing = await this.couponRepo.findByCode(dto.code);
    if (existing) throw new ConflictError('Coupon code already exists');

    const coupon = await this.couponRepo.create({
      ...dto,
      code: dto.code.toUpperCase().trim(),
      createdBy: adminId,
      usedCount: 0
    } as any);

    return coupon;
  }

  async updateCoupon(couponId: string, dto: any): Promise<ICoupon> {
    const coupon = await this.couponRepo.findById(couponId);
    if (!coupon) throw new NotFoundError('Coupon not found');

    if (dto.code) {
      dto.code = dto.code.toUpperCase().trim();
      const existing = await this.couponRepo.findByCode(dto.code);
      if (existing && existing._id !== couponId) throw new ConflictError('Coupon code already exists');
    }

    return this.couponRepo.update(couponId, dto) as Promise<ICoupon>;
  }

  async deleteCoupon(couponId: string): Promise<void> {
    const coupon = await this.couponRepo.findById(couponId);
    if (!coupon) throw new NotFoundError('Coupon not found');
    if (coupon.usedCount > 0) throw new ConflictError('Cannot delete coupon that has been used');
    await this.couponRepo.delete(couponId);
  }

  async getCouponById(couponId: string): Promise<ICoupon> {
    const coupon = await this.couponRepo.findById(couponId);
    if (!coupon) throw new NotFoundError('Coupon not found');
    return coupon;
  }

  async searchCoupons(filters: any): Promise<{ coupons: ICoupon[]; total: number }> {
    return this.couponRepo.searchCoupons(filters, filters.page, filters.limit);
  }

  async bulkAction(couponIds: string[], action: string): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of couponIds) {
      try {
        if (action === 'activate') {
          await this.couponRepo.update(id, { isActive: true });
        } else if (action === 'deactivate') {
          await this.couponRepo.update(id, { isActive: false });
        } else if (action === 'delete') {
          await this.deleteCoupon(id);
        }
        success.push(id);
      } catch (err: any) {
        failed.push({ id, error: err.message });
      }
    }

    return { success, failed };
  }

  // ─── VALIDATION ───

  async validateCoupon(code: string, listingId: string, listingType: string, vendorId: string, amount: number, userId: string): Promise<{ valid: boolean; coupon?: ICoupon; discountAmount: number; message?: string }> {
    const coupon = await this.couponRepo.findByCode(code);
    if (!coupon) return { valid: false, discountAmount: 0, message: 'Invalid coupon code' };

    // Check active
    if (!coupon.isActive) return { valid: false, discountAmount: 0, message: 'Coupon is inactive' };

    // Check dates
    const now = new Date();
    if (now < coupon.startDate) return { valid: false, discountAmount: 0, message: 'Coupon not yet active' };
    if (now > coupon.endDate) return { valid: false, discountAmount: 0, message: 'Coupon has expired' };

    // Check total usage limit
    if (coupon.usedCount >= coupon.usageLimitTotal) {
      return { valid: false, discountAmount: 0, message: 'Coupon usage limit reached' };
    }

    // Check per-user limit
    const userRedemptionCount = await this.couponRepo.getUserRedemptionCount(coupon._id, userId);
    if (userRedemptionCount >= coupon.usageLimitPerUser) {
      return { valid: false, discountAmount: 0, message: 'You have already used this coupon maximum times' };
    }

    // Check min order value
    if (amount < coupon.minOrderValue) {
      return { valid: false, discountAmount: 0, message: `Minimum order value of ₹${coupon.minOrderValue} required` };
    }

    // Check listing type
    if (coupon.applicableListingTypes.length > 0 && !coupon.applicableListingTypes.includes(listingType)) {
      return { valid: false, discountAmount: 0, message: 'Coupon not applicable for this listing type' };
    }

    // Check vendor
    if (coupon.type === 'vendor' && coupon.vendorId !== vendorId) {
      return { valid: false, discountAmount: 0, message: 'Coupon not valid for this vendor' };
    }
    if (coupon.applicableVendorIds && coupon.applicableVendorIds.length > 0 && !coupon.applicableVendorIds.includes(vendorId)) {
      return { valid: false, discountAmount: 0, message: 'Coupon not valid for this vendor' };
    }

    // Check listing inclusion/exclusion
    if (coupon.applicableListingIds && coupon.applicableListingIds.length > 0 && !coupon.applicableListingIds.includes(listingId)) {
      return { valid: false, discountAmount: 0, message: 'Coupon not valid for this listing' };
    }
    if (coupon.excludedListingIds && coupon.excludedListingIds.includes(listingId)) {
      return { valid: false, discountAmount: 0, message: 'Coupon not valid for this listing' };
    }

    // Check first-time only
    if (coupon.firstTimeOnly) {
      const userBookings = await this.bookingRepo.findByCustomerId(userId, {}, 1, 1);
      if (userBookings.total > 0) {
        return { valid: false, discountAmount: 0, message: 'Coupon valid for first booking only' };
      }
    }

    // Check new user only
    if (coupon.newUserOnly) {
      const user = await this.userRepo.findById(userId);
      const daysSinceJoin = user ? (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 999;
      if (daysSinceJoin > 30) {
        return { valid: false, discountAmount: 0, message: 'Coupon valid for new users only (joined within 30 days)' };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = amount * (coupon.discountValue / 100);
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else if (coupon.discountType === 'flat') {
      discountAmount = Math.min(coupon.discountValue, amount);
    } else if (coupon.discountType === 'cashback') {
      // Cashback is credited after purchase, not deducted at checkout
      discountAmount = 0;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return { valid: true, coupon, discountAmount };
  }

  async applyCoupon(code: string, bookingId: string, userId: string): Promise<{ discountAmount: number; finalAmount: number; coupon: ICoupon }> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== userId) throw new ForbiddenError('Not your booking');
    if (booking.status !== 'PENDING') throw new ConflictError('Cannot apply coupon to confirmed booking');

    const validation = await this.validateCoupon(
      code,
      booking.listingId,
      booking.metadata.listingType,
      booking.vendorId,
      booking.totalAmount,
      userId
    );

    if (!validation.valid) throw new ValidationError(validation.message || 'Invalid coupon');

    const discountAmount = validation.discountAmount;
    const finalAmount = booking.totalAmount + booking.taxAmount.totalTax + booking.platformFee - discountAmount;

    // Update booking
    await this.bookingRepo.update(bookingId, {
      couponCode: code.toUpperCase(),
      couponDiscount: discountAmount,
      discountAmount,
      finalAmount: Math.max(0, finalAmount)
    });

    // Increment coupon usage
    await this.couponRepo.incrementUsage(validation.coupon!._id);

    // Create redemption record
    await this.couponRepo.createRedemption({
      couponId: validation.coupon!._id,
      userId,
      bookingId,
      discountAmount
    } as any);

    // Handle cashback
    if (validation.coupon!.discountType === 'cashback') {
      const cashbackAmount = booking.totalAmount * ((validation.coupon!.cashbackPercent || 0) / 100);
      // Cashback credited after booking completion (Phase 12 reward service)
    }

    return { discountAmount, finalAmount: Math.max(0, finalAmount), coupon: validation.coupon! };
  }

  async removeCoupon(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== userId) throw new ForbiddenError('Not your booking');
    if (booking.status !== 'PENDING') throw new ConflictError('Cannot remove coupon from confirmed booking');
    if (!booking.couponCode) throw new ConflictError('No coupon applied');

    const finalAmount = booking.totalAmount + booking.taxAmount.totalTax + booking.platformFee;

    await this.bookingRepo.update(bookingId, {
      couponCode: null,
      couponDiscount: 0,
      discountAmount: 0,
      finalAmount
    });
  }

  async getAvailableCoupons(listingId: string, listingType: string, vendorId: string, userId: string): Promise<ICoupon[]> {
    const coupons = await this.couponRepo.findActiveByListing(listingId, listingType, vendorId);
    const available: ICoupon[] = [];

    for (const coupon of coupons) {
      const userRedemptionCount = await this.couponRepo.getUserRedemptionCount(coupon._id, userId);
      if (userRedemptionCount < coupon.usageLimitPerUser) {
        available.push(coupon);
      }
    }

    return available;
  }

  async getCouponStats(couponId: string): Promise<any> {
    return this.couponRepo.getCouponStats(couponId);
  }
}
