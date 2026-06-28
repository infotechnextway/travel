import { BookingRepository } from './booking.repository';
import { IBooking, ITraveler, ICancellationPolicySnapshot, IRefundBreakdown } from './booking.model';
import { ListingRepository } from '@modules/listings/listing.repository';
import { UserRepository } from '@modules/users/user.repository';
import { VendorRepository } from '@modules/vendors/vendor.repository';
import { AppError, NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import { BookingStatus, PaymentStatus, Currency, UserRole, Permission } from '@shared/enums';
import mongoose from 'mongoose';

// In-memory lock store (replaces Redis for simplified deployment)
const inventoryLocks = new Map<string, { bookingId: string; expiresAt: number }>();

function setLock(key: string, ttlSeconds: number, bookingId: string): void {
  inventoryLocks.set(key, { bookingId, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function deleteLock(key: string): void {
  inventoryLocks.delete(key);
}

// Periodically clean expired locks (every 60s)
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of inventoryLocks.entries()) {
    if (lock.expiresAt < now) inventoryLocks.delete(key);
  }
}, 60_000).unref();

const COUPONS: Record<string, any> = {}; // Placeholder until Phase 11

export class BookingService {
  constructor(
    private bookingRepo: BookingRepository,
    private listingRepo: ListingRepository,
    private userRepo: UserRepository,
    private vendorRepo: VendorRepository
  ) {}

  // ─── CUSTOMER METHODS ───

  async createDraft(customerId: string, dto: any): Promise<IBooking> {
    const listing = await this.listingRepo.findById(dto.listingId);
    if (!listing) throw new NotFoundError('Listing not found');
    if (listing.status !== 'published') throw new ConflictError('Listing is not available for booking');

    const totalTravelers = dto.travelers.adults + dto.travelers.children + dto.travelers.infants;
    if (totalTravelers > (listing.maxGroupSize || 50)) {
      throw new ValidationError(`Maximum group size is ${listing.maxGroupSize || 50}`);
    }

    const { totalAmount, pricePerPerson, platformFee, commissionAmount, vendorPayoutAmount } = 
      await this.calculatePricing(listing, dto.travelers, null);

    const taxAmount = this.calculateGst(totalAmount, listing.pricing?.taxRate || 18);
    const finalAmount = totalAmount + taxAmount.totalTax + platformFee - 0; // no coupon yet

    const policy = this.getCancellationPolicy(listing.cancellationPolicy || 'moderate');

    const booking = await this.bookingRepo.create({
      customerId,
      listingId: dto.listingId,
      vendorId: listing.vendorId.toString(),
      status: BookingStatus.PENDING,
      travelDates: dto.travelDates,
      travelers: [],
      totalAmount,
      discountAmount: 0,
      taxAmount,
      platformFee,
      commissionAmount,
      vendorPayoutAmount,
      finalAmount,
      currency: listing.pricing?.currency || Currency.INR,
      paymentStatus: PaymentStatus.PENDING,
      cancellationPolicySnapshot: policy,
      metadata: {
        listingTitle: listing.title,
        listingType: listing.listingType,
        destinationName: listing.destinationName || '',
        vendorName: listing.vendorName || '',
        originalPrice: listing.pricing?.basePrice || 0,
        pricePerPerson
      },
      specialRequests: dto.specialRequests
    } as any);

    return booking;
  }

  async updateDraft(bookingId: string, customerId: string, dto: any): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Only draft bookings can be updated');

    const updates: any = {};
    if (dto.travelDates) {
      updates.travelDates = dto.travelDates;
    }
    if (dto.specialRequests !== undefined) updates.specialRequests = dto.specialRequests;

    // Recalculate pricing if dates changed (affects availability)
    if (dto.travelDates) {
      const listing = await this.listingRepo.findById(booking.listingId);
      if (!listing) throw new NotFoundError('Listing not found');
      const travelerCount = booking.travelers.length || 1;
      const travelers = { adults: travelerCount, children: 0, infants: 0 };
      const pricing = await this.calculatePricing(listing, travelers, booking.couponCode || null);
      const taxAmount = this.calculateGst(pricing.totalAmount, listing.pricing?.taxRate || 18);
      const couponDiscount = booking.couponDiscount || 0;
      const finalAmount = pricing.totalAmount + taxAmount.totalTax + pricing.platformFee - couponDiscount;

      updates.totalAmount = pricing.totalAmount;
      updates.taxAmount = taxAmount;
      updates.platformFee = pricing.platformFee;
      updates.commissionAmount = pricing.commissionAmount;
      updates.vendorPayoutAmount = pricing.vendorPayoutAmount;
      updates.finalAmount = finalAmount;
    }

    return this.bookingRepo.update(bookingId, updates);
  }

  async addTraveler(bookingId: string, customerId: string, dto: any): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Cannot modify travelers after confirmation');
    if (booking.travelers.length >= 50) throw new ValidationError('Maximum 50 travelers allowed');

    const traveler: ITraveler = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...dto
    };

    const updated = await this.bookingRepo.update(bookingId, {
      $push: { travelers: traveler }
    } as any);

    // Recalculate pricing based on new traveler count
    const listing = await this.listingRepo.findById(booking.listingId);
    if (listing) {
      const adults = (updated?.travelers || []).filter((t: any) => !t.dateOfBirth || this.getAge(t.dateOfBirth) >= 12).length;
      const children = (updated?.travelers || []).filter((t: any) => t.dateOfBirth && this.getAge(t.dateOfBirth) < 12 && this.getAge(t.dateOfBirth) >= 2).length;
      const infants = (updated?.travelers || []).filter((t: any) => t.dateOfBirth && this.getAge(t.dateOfBirth) < 2).length;
      const pricing = await this.calculatePricing(listing, { adults, children, infants }, booking.couponCode || null);
      const taxAmount = this.calculateGst(pricing.totalAmount, listing.pricing?.taxRate || 18);
      const couponDiscount = booking.couponDiscount || 0;
      const finalAmount = pricing.totalAmount + taxAmount.totalTax + pricing.platformFee - couponDiscount;

      await this.bookingRepo.update(bookingId, {
        totalAmount: pricing.totalAmount,
        taxAmount,
        platformFee: pricing.platformFee,
        commissionAmount: pricing.commissionAmount,
        vendorPayoutAmount: pricing.vendorPayoutAmount,
        finalAmount
      });
    }

    return this.bookingRepo.findById(bookingId) as Promise<IBooking>;
  }

  async removeTraveler(bookingId: string, customerId: string, travelerId: string): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Cannot modify travelers after confirmation');

    await this.bookingRepo.update(bookingId, {
      $pull: { travelers: { _id: travelerId } }
    } as any);

    // Recalculate pricing
    const updated = await this.bookingRepo.findById(bookingId);
    const listing = await this.listingRepo.findById(booking.listingId);
    if (listing && updated) {
      const adults = updated.travelers.filter((t: any) => !t.dateOfBirth || this.getAge(t.dateOfBirth) >= 12).length || 1;
      const children = updated.travelers.filter((t: any) => t.dateOfBirth && this.getAge(t.dateOfBirth) < 12 && this.getAge(t.dateOfBirth) >= 2).length;
      const infants = updated.travelers.filter((t: any) => t.dateOfBirth && this.getAge(t.dateOfBirth) < 2).length;
      const pricing = await this.calculatePricing(listing, { adults, children, infants }, booking.couponCode || null);
      const taxAmount = this.calculateGst(pricing.totalAmount, listing.pricing?.taxRate || 18);
      const couponDiscount = booking.couponDiscount || 0;
      const finalAmount = pricing.totalAmount + taxAmount.totalTax + pricing.platformFee - couponDiscount;

      await this.bookingRepo.update(bookingId, {
        totalAmount: pricing.totalAmount,
        taxAmount,
        platformFee: pricing.platformFee,
        commissionAmount: pricing.commissionAmount,
        vendorPayoutAmount: pricing.vendorPayoutAmount,
        finalAmount
      });
    }

    return this.bookingRepo.findById(bookingId) as Promise<IBooking>;
  }

  async applyCoupon(bookingId: string, customerId: string, code: string): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Cannot apply coupon to confirmed booking');

    // Validate coupon (placeholder until Phase 11)
    const coupon = await this.validateCoupon(code, booking.listingId, booking.totalAmount, customerId);
    if (!coupon) throw new ValidationError('Invalid or expired coupon code');
    if (booking.couponCode) throw new ConflictError('Coupon already applied. Remove it first.');

    const discount = coupon.discountType === 'percent' 
      ? Math.min(booking.totalAmount * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
      : Math.min(coupon.discountValue, booking.totalAmount);

    const finalAmount = booking.totalAmount + booking.taxAmount.totalTax + booking.platformFee - discount;

    return this.bookingRepo.update(bookingId, {
      couponCode: code,
      couponDiscount: discount,
      discountAmount: discount,
      finalAmount: Math.max(0, finalAmount)
    }) as Promise<IBooking>;
  }

  async removeCoupon(bookingId: string, customerId: string): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Cannot modify confirmed booking');

    const finalAmount = booking.totalAmount + booking.taxAmount.totalTax + booking.platformFee;

    return this.bookingRepo.update(bookingId, {
      couponCode: null,
      couponDiscount: 0,
      discountAmount: 0,
      finalAmount
    }) as Promise<IBooking>;
  }

  async initiateCheckout(bookingId: string, customerId: string): Promise<{ booking: IBooking; paymentOrder: any }> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Booking is not in draft state');
    if (booking.travelers.length === 0) throw new ValidationError('Add at least one traveler');

    // Check real-time availability
    const isAvailable = await this.checkInventory(booking.listingId, booking.travelers.length);
    if (!isAvailable) throw new ConflictError('Sorry, this experience is no longer available for selected dates');

    // Lock inventory for 15 minutes
    const lockKey = `booking_lock:${booking.listingId}:${booking.travelDates.startDate.toISOString().split('T')[0]}`;
    const lockExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await setLock(lockKey, 15 * 60, bookingId);

    await this.bookingRepo.update(bookingId, { inventoryLockExpiry: lockExpiry });

    // Create payment order (placeholder for Phase 11)
    const paymentOrder = {
      orderId: `order_${Date.now()}`,
      amount: booking.finalAmount,
      currency: booking.currency,
      expiresAt: lockExpiry
    };

    const updated = await this.bookingRepo.findById(bookingId) as IBooking;
    return { booking: updated, paymentOrder };
  }

  async confirmBooking(bookingId: string, customerId: string, paymentResult: any): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.PENDING) throw new ConflictError('Booking already processed');

    // Verify payment (Phase 11 will handle gateway verification)
    if (!paymentResult || !paymentResult.success) {
      throw new ValidationError('Payment verification failed');
    }

    // Release lock and decrement inventory
    const lockKey = `booking_lock:${booking.listingId}:${booking.travelDates.startDate.toISOString().split('T')[0]}`;
    await deleteLock(lockKey);

    // Update booking
    const updates: any = {
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: paymentResult.method || 'card',
      inventoryLockExpiry: null
    };

    // If vendor requires confirmation, set vendorConfirmed to false
    const listing = await this.listingRepo.findById(booking.listingId);
    if (listing && !listing.instantBook) {
      updates.vendorConfirmed = false;
    } else {
      updates.vendorConfirmed = true;
      updates.vendorConfirmedAt = new Date();
    }

    return this.bookingRepo.update(bookingId, updates) as Promise<IBooking>;
  }

  async cancelBooking(bookingId: string, customerId: string, reason: string, refundToWallet: boolean = true): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status as any)) {
      throw new ConflictError('Booking cannot be cancelled');
    }

    const penalty = this.calculatePenalty(booking, new Date());
    const refundAmount = booking.finalAmount - penalty;

    const refundBreakdown: IRefundBreakdown = {
      refundAmount: Math.max(0, refundAmount),
      penaltyAmount: penalty,
      platformFeeRetained: booking.platformFee,
      commissionRetained: penalty > 0 ? booking.commissionAmount : 0,
      gstOnCommission: 0,
      netRefundToCustomer: Math.max(0, refundAmount),
      refundMethod: refundToWallet ? 'wallet' : 'original',
      processedAt: undefined
    };

    const updates: any = {
      status: BookingStatus.CANCELLED,
      cancellationReason: reason,
      penaltyAmount: penalty,
      refundAmount: Math.max(0, refundAmount),
      refundStatus: refundAmount > 0 ? 'requested' : 'none',
      refundBreakdown,
      paymentStatus: refundAmount > 0 ? PaymentStatus.REFUND_PENDING : PaymentStatus.FAILED
    };

    // Release any inventory lock
    if (booking.inventoryLockExpiry) {
      const lockKey = `booking_lock:${booking.listingId}:${booking.travelDates.startDate.toISOString().split('T')[0]}`;
      await deleteLock(lockKey);
      updates.inventoryLockExpiry = null;
    }

    return this.bookingRepo.update(bookingId, updates) as Promise<IBooking>;
  }

  async getMyBookings(customerId: string, filters: any): Promise<{ bookings: IBooking[]; total: number; stats: any }> {
    const { bookings, total } = await this.bookingRepo.findByCustomerId(customerId, filters, filters.page, filters.limit);

    const stats = {
      totalBookings: total,
      upcoming: bookings.filter((b: any) => [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(b.status) && new Date(b.travelDates.startDate) >= new Date()).length,
      completed: bookings.filter((b: any) => [BookingStatus.COMPLETED, BookingStatus.REVIEWED].includes(b.status)).length,
      cancelled: bookings.filter((b: any) => b.status === BookingStatus.CANCELLED).length,
      totalSpent: bookings.filter((b: any) => [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.REVIEWED].includes(b.status)).reduce((sum: number, b: any) => sum + b.finalAmount, 0)
    };

    return { bookings, total, stats };
  }

  async getBookingDetails(bookingId: string, userId: string, userRole: UserRole): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const isOwner = booking.customerId === userId;
    const isVendor = booking.vendorId === userId;
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole);

    if (!isOwner && !isVendor && !isAdmin) throw new ForbiddenError('Access denied');

    return booking;
  }

  // ─── VENDOR METHODS ───

  async getVendorBookings(vendorId: string, filters: any): Promise<{ bookings: IBooking[]; total: number; stats: any }> {
    const { bookings, total } = await this.bookingRepo.findByVendorId(vendorId, filters, filters.page, filters.limit);

    const stats = {
      totalBookings: total,
      pending: bookings.filter((b: any) => b.status === BookingStatus.PENDING).length,
      confirmed: bookings.filter((b: any) => b.status === BookingStatus.CONFIRMED).length,
      completed: bookings.filter((b: any) => [BookingStatus.COMPLETED, BookingStatus.REVIEWED].includes(b.status)).length,
      cancelled: bookings.filter((b: any) => b.status === BookingStatus.CANCELLED).length,
      totalRevenue: bookings.filter((b: any) => [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.REVIEWED].includes(b.status)).reduce((sum: number, b: any) => sum + b.vendorPayoutAmount, 0)
    };

    return { bookings, total, stats };
  }

  async confirmBookingVendor(bookingId: string, vendorId: string): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.vendorId !== vendorId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.CONFIRMED) throw new ConflictError('Booking must be confirmed by customer first');
    if (booking.vendorConfirmed) throw new ConflictError('Already confirmed');

    return this.bookingRepo.update(bookingId, {
      vendorConfirmed: true,
      vendorConfirmedAt: new Date()
    }) as Promise<IBooking>;
  }

  async markComplete(bookingId: string, vendorId: string): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.vendorId !== vendorId) throw new ForbiddenError('Not your booking');
    if (booking.status !== BookingStatus.CONFIRMED) throw new ConflictError('Booking must be confirmed');

    return this.bookingRepo.update(bookingId, {
      status: BookingStatus.COMPLETED,
      completedAt: new Date()
    }) as Promise<IBooking>;
  }

  async rescheduleBookingVendor(bookingId: string, vendorId: string, newDates: any, reason: string): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.vendorId !== vendorId) throw new ForbiddenError('Not your booking');
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status as any)) {
      throw new ConflictError('Cannot reschedule this booking');
    }

    // Check availability for new dates
    const isAvailable = await this.checkInventory(booking.listingId, booking.travelers.length);
    if (!isAvailable) throw new ConflictError('Not available for new dates');

    await this.bookingRepo.update(bookingId, {
      $push: {
        adminNotes: `Rescheduled by vendor on ${new Date().toISOString()}. Reason: ${reason}. Old dates: ${booking.travelDates.startDate} - ${booking.travelDates.endDate}`
      }
    } as any);

    return this.bookingRepo.update(bookingId, {
      travelDates: newDates
    }) as Promise<IBooking>;
  }

  // ─── ADMIN METHODS ───

  async getAllBookings(filters: any): Promise<{ bookings: IBooking[]; total: number }> {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.refundStatus) query.refundStatus = filters.refundStatus;
    if (filters.listingType) query['metadata.listingType'] = filters.listingType;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.vendorId) query.vendorId = filters.vendorId;
    if (filters.startDateFrom || filters.startDateTo) {
      query['travelDates.startDate'] = {};
      if (filters.startDateFrom) query['travelDates.startDate'].$gte = filters.startDateFrom;
      if (filters.startDateTo) query['travelDates.startDate'].$lte = filters.startDateTo;
    }
    if (filters.search) {
      query.$or = [
        { bookingCode: { $regex: filters.search, $options: 'i' } },
        { 'metadata.listingTitle': { $regex: filters.search, $options: 'i' } }
      ];
    }

    const sort: any = {};
    sort[filters.sort || 'createdAt'] = filters.order === 'asc' ? 1 : -1;

    const [bookings, total] = await Promise.all([
      this.bookingRepo.model.find(query).sort(sort).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
      this.bookingRepo.model.countDocuments(query)
    ]);

    return { bookings, total };
  }

  async adminCancel(bookingId: string, adminId: string, reason: string): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status as any)) {
      throw new ConflictError('Booking cannot be cancelled');
    }

    const refundAmount = booking.finalAmount; // Full refund for admin cancellations
    const refundBreakdown: IRefundBreakdown = {
      refundAmount,
      penaltyAmount: 0,
      platformFeeRetained: 0,
      commissionRetained: 0,
      gstOnCommission: 0,
      netRefundToCustomer: refundAmount,
      refundMethod: 'original',
      processedAt: new Date()
    };

    return this.bookingRepo.update(bookingId, {
      status: BookingStatus.CANCELLED,
      cancellationReason: `[ADMIN CANCEL by ${adminId}] ${reason}`,
      penaltyAmount: 0,
      refundAmount,
      refundStatus: 'approved',
      refundBreakdown,
      paymentStatus: PaymentStatus.REFUNDED,
      adminNotes: `Cancelled by admin ${adminId}. Reason: ${reason}`
    }) as Promise<IBooking>;
  }

  async reassignGuide(bookingId: string, adminId: string, guideId: string): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status as any)) {
      throw new ConflictError('Cannot reassign guide for this booking');
    }

    return this.bookingRepo.update(bookingId, {
      guideId,
      adminNotes: `Guide reassigned by admin ${adminId} to ${guideId}`
    }) as Promise<IBooking>;
  }

  async processRefund(bookingId: string, adminId: string, dto: any): Promise<IBooking> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.refundStatus !== 'requested') throw new ConflictError('No refund requested for this booking');

    const refundBreakdown: IRefundBreakdown = {
      refundAmount: dto.amount,
      penaltyAmount: booking.penaltyAmount,
      platformFeeRetained: booking.platformFee,
      commissionRetained: booking.commissionAmount,
      gstOnCommission: 0,
      netRefundToCustomer: dto.amount,
      refundMethod: dto.method,
      processedAt: new Date()
    };

    return this.bookingRepo.update(bookingId, {
      refundAmount: dto.amount,
      refundStatus: 'processed',
      refundBreakdown,
      paymentStatus: PaymentStatus.REFUNDED,
      adminNotes: `Refund processed by admin ${adminId}. Amount: ${dto.amount}. Method: ${dto.method}. Reason: ${dto.reason}`
    }) as Promise<IBooking>;
  }

  async getBookingStats(startDate?: Date, endDate?: Date): Promise<any> {
    return this.bookingRepo.getBookingStats(startDate, endDate);
  }

  async getRevenueReport(startDate: Date, endDate: Date): Promise<any> {
    return this.bookingRepo.getRevenueReport(startDate, endDate);
  }

  async bulkAction(bookingIds: string[], action: string, reason: string, adminId: string): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of bookingIds) {
      try {
        if (action === 'cancel') {
          await this.adminCancel(id, adminId, reason);
        } else if (action === 'mark_complete') {
          await this.bookingRepo.update(id, { status: BookingStatus.COMPLETED, completedAt: new Date() });
        } else if (action === 'approve_refund') {
          const booking = await this.bookingRepo.findById(id);
          if (booking && booking.refundStatus === 'requested') {
            await this.processRefund(id, adminId, { amount: booking.refundAmount, method: 'original', reason });
          }
        }
        success.push(id);
      } catch (err: any) {
        failed.push({ id, error: err.message });
      }
    }

    return { success, failed };
  }

  // ─── HELPERS ───

  private async calculatePricing(listing: any, travelers: any, couponCode: string | null): Promise<any> {
    const pricing = listing.pricing || {};
    const adults = travelers.adults || 1;
    const children = travelers.children || 0;
    const infants = travelers.infants || 0;

    let basePrice = pricing.basePrice || 0;
    let pricePerPerson = pricing.pricePerPerson || basePrice;

    // Group slab pricing
    const totalPax = adults + children;
    const slabs = pricing.groupSlabs || [];
    for (const slab of slabs.sort((a: any, b: any) => b.minPax - a.minPax)) {
      if (totalPax >= slab.minPax && totalPax <= (slab.maxPax || Infinity)) {
        pricePerPerson = slab.pricePerPerson;
        break;
      }
    }

    const adultPrice = pricePerPerson * adults;
    const childPrice = (pricing.childPrice || pricePerPerson * 0.5) * children;
    const infantPrice = (pricing.infantPrice || 0) * infants;
    const totalAmount = adultPrice + childPrice + infantPrice;

    const commissionRate = listing.commissionRate || 0.15;
    const platformFeeRate = 0.02; // 2% platform fee
    const commissionAmount = totalAmount * commissionRate;
    const platformFee = totalAmount * platformFeeRate;
    const vendorPayoutAmount = totalAmount - commissionAmount;

    return { totalAmount, pricePerPerson, commissionAmount, platformFee, vendorPayoutAmount };
  }

  private calculateGst(amount: number, taxRate: number = 18): any {
    const totalTax = amount * (taxRate / 100);
    // Simplified: assume intra-state (CGST + SGST)
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const igst = 0;
    return { cgst, sgst, igst, totalTax };
  }

  private async checkInventory(listingId: string, travelers: number): Promise<boolean> {
    // Placeholder: actual inventory check will use listing calendar
    const listing = await this.listingRepo.findById(listingId);
    if (!listing) return false;
    // Check if enough slots available
    return true; // Simplified for Phase 10
  }

  private getCancellationPolicy(policy: string): ICancellationPolicySnapshot {
    const policies: Record<string, ICancellationPolicySnapshot> = {
      flexible: {
        policyType: 'flexible',
        freeCancellationHours: 48,
        partialRefundHours: 24,
        partialRefundPercent: 50,
        noRefundHours: 24,
        description: 'Full refund if cancelled 48+ hours before. 50% refund if 24-48 hours before. No refund within 24 hours.'
      },
      moderate: {
        policyType: 'moderate',
        freeCancellationHours: 168,
        partialRefundHours: 72,
        partialRefundPercent: 50,
        noRefundHours: 72,
        description: 'Full refund if cancelled 7+ days before. 50% refund if 3-7 days before. No refund within 3 days.'
      },
      strict: {
        policyType: 'strict',
        freeCancellationHours: 336,
        partialRefundHours: 168,
        partialRefundPercent: 50,
        noRefundHours: 168,
        description: 'Full refund if cancelled 14+ days before. 50% refund if 7-14 days before. No refund within 7 days.'
      },
      non_refundable: {
        policyType: 'non_refundable',
        freeCancellationHours: 0,
        partialRefundHours: 0,
        partialRefundPercent: 0,
        noRefundHours: 0,
        description: 'This booking is non-refundable.'
      }
    };
    return policies[policy] || policies.moderate;
  }

  private calculatePenalty(booking: IBooking, cancelDate: Date): number {
    const policy = booking.cancellationPolicySnapshot;
    if (!policy) return 0;

    const hoursBefore = (booking.travelDates.startDate.getTime() - cancelDate.getTime()) / (1000 * 60 * 60);

    if (hoursBefore >= policy.freeCancellationHours) return 0;
    if (hoursBefore >= policy.partialRefundHours) {
      return booking.totalAmount * (policy.partialRefundPercent / 100);
    }
    return booking.totalAmount; // Full forfeiture
  }

  private getAge(dob: Date): number {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  private async validateCoupon(code: string, listingId: string, amount: number, customerId: string): Promise<any> {
    // Placeholder until Phase 11
    const mockCoupons: Record<string, any> = {
      WELCOME500: { code: 'WELCOME500', discountType: 'flat', discountValue: 500, maxDiscount: 500, minOrderValue: 1000, applicableListingTypes: ['tour', 'activity', 'hotel', 'transport'] },
      ADVENTURE20: { code: 'ADVENTURE20', discountType: 'percent', discountValue: 20, maxDiscount: 2000, minOrderValue: 500, applicableListingTypes: ['tour', 'activity'] }
    };
    return mockCoupons[code.toUpperCase()] || null;
  }
}
