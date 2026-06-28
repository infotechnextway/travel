import { ReviewRepository } from './review.repository';
import { IReview, IReviewMedia } from './review.model';
import { BookingRepository } from '@modules/bookings/booking.repository';
import { BookingModel, IBooking } from '@modules/bookings/booking.model';
import { RewardService } from './reward.service';
import { AppError, NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors';
import { BookingStatus } from '@shared/enums';

export class ReviewService {
  constructor(
    private reviewRepo: ReviewRepository,
    private bookingRepo: BookingRepository,
    private rewardService: RewardService
  ) {}

  // ─── CUSTOMER METHODS ───

  async createReview(customerId: string, dto: any): Promise<IReview> {
    const booking = await this.bookingRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenError('Not your booking');

    // Check review eligibility: booking must be COMPLETED or REVIEWED
    if (![BookingStatus.COMPLETED, BookingStatus.REVIEWED].includes(booking.status as any)) {
      throw new ConflictError('You can only review completed trips');
    }

    // Check if already reviewed
    const existing = await this.reviewRepo.findByBookingId(dto.bookingId);
    if (existing) throw new ConflictError('You have already reviewed this booking');

    // Check trip end date (can review within 90 days of completion)
    const tripEndDate = new Date(booking.travelDates.endDate);
    const daysSinceTrip = (Date.now() - tripEndDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceTrip > 90) {
      throw new ValidationError('Review window has closed (90 days after trip)');
    }

    const review = await this.reviewRepo.create({
      bookingId: dto.bookingId,
      customerId,
      listingId: booking.listingId,
      vendorId: booking.vendorId,
      guideId: booking.guideId,
      rating: dto.rating,
      dimensions: dto.dimensions,
      title: dto.title,
      comment: dto.comment,
      media: dto.media || [],
      isVerified: true,
      isApproved: false,
      moderationStatus: 'pending'
    } as any);

    // Mark booking as REVIEWED
    await this.bookingRepo.update(dto.bookingId, { status: BookingStatus.REVIEWED, reviewedAt: new Date() });

    // Award points for review
    try {
      await this.rewardService.earnPointsOnReview(customerId, review._id);
    } catch (e) {
      // Non-blocking: log but don't fail review creation
    }

    return review;
  }

  async updateReview(reviewId: string, customerId: string, dto: any): Promise<IReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');
    if (review.customerId !== customerId) throw new ForbiddenError('Not your review');
    if (review.isDeleted) throw new ConflictError('Review has been deleted');
    if (review.moderationStatus === 'rejected') throw new ConflictError('Cannot edit a rejected review');

    // If review was already approved, editing resets to pending moderation
    const updates: any = { ...dto };
    if (review.isApproved) {
      updates.isApproved = false;
      updates.moderationStatus = 'pending';
    }

    return this.reviewRepo.update(reviewId, updates) as Promise<IReview>;
  }

  async deleteReview(reviewId: string, customerId: string): Promise<void> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');
    if (review.customerId !== customerId) throw new ForbiddenError('Not your review');

    await this.reviewRepo.update(reviewId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: customerId
    });
  }

  async getMyReviews(customerId: string, page: number = 1, limit: number = 20): Promise<{ reviews: IReview[]; total: number }> {
    return this.reviewRepo.findByCustomerId(customerId, page, limit);
  }

  // ─── PUBLIC DISCOVERY ───

  async getListingReviews(listingId: string, filters: any): Promise<{ reviews: IReview[]; total: number; summary: any }> {
    const [reviewData, summary] = await Promise.all([
      this.reviewRepo.findByListingId(listingId, filters, filters.page, filters.limit),
      this.reviewRepo.getListingRatingSummary(listingId)
    ]);
    return { ...reviewData, summary };
  }

  async getReviewById(reviewId: string): Promise<IReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');
    if (!review.isApproved || review.isDeleted) throw new NotFoundError('Review not available');
    return review;
  }

  async voteReview(reviewId: string, userId: string, isHelpful: boolean): Promise<{ helpfulCount: number; unhelpfulCount: number }> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');
    if (!review.isApproved || review.isDeleted) throw new NotFoundError('Review not available');
    if (review.customerId === userId) throw new ValidationError('Cannot vote on your own review');

    const existingVote = await this.reviewRepo.getUserVote(reviewId, userId);

    if (existingVote) {
      if (existingVote.isHelpful === isHelpful) {
        // Toggle off: remove vote
        await this.reviewRepo.removeVote(reviewId, userId, existingVote.isHelpful);
      } else {
        // Change vote
        await this.reviewRepo.updateVote(reviewId, userId, existingVote.isHelpful, isHelpful);
      }
    } else {
      await this.reviewRepo.addVote(reviewId, userId, isHelpful);
    }

    const updated = await this.reviewRepo.findById(reviewId);
    return { helpfulCount: updated?.helpfulCount || 0, unhelpfulCount: updated?.unhelpfulCount || 0 };
  }

  async reportReview(reviewId: string, userId: string, reason: string): Promise<void> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');
    if (review.customerId === userId) throw new ValidationError('Cannot report your own review');

    await this.reviewRepo.update(reviewId, {
      $inc: { reportedCount: 1 },
      $push: { reportReasons: reason },
      moderationStatus: 'flagged'
    } as any);
  }

  // ─── VENDOR METHODS ───

  async getVendorReviews(vendorId: string, page: number = 1, limit: number = 20): Promise<{ reviews: IReview[]; total: number; summary: any }> {
    const [reviews, totalObj, summary] = await Promise.all([
      this.reviewRepo.findByVendorId(vendorId, page, limit),
      this.reviewRepo.findByVendorId(vendorId, 1, 1),
      this.reviewRepo.getVendorRatingSummary(vendorId)
    ]);
    return { reviews: reviews.reviews, total: reviews.total, summary };
  }

  async respondToReview(reviewId: string, vendorId: string, text: string): Promise<IReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');
    if (review.vendorId !== vendorId) throw new ForbiddenError('Not your listing\'s review');
    if (!review.isApproved) throw new ConflictError('Cannot respond to unapproved review');
    if (review.isDeleted) throw new ConflictError('Review has been deleted');
    if (review.vendorResponse) throw new ConflictError('You have already responded to this review');

    return this.reviewRepo.update(reviewId, {
      vendorResponse: {
        text,
        respondedAt: new Date(),
        respondedBy: vendorId
      }
    }) as Promise<IReview>;
  }

  async updateVendorResponse(reviewId: string, vendorId: string, text: string): Promise<IReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');
    if (review.vendorId !== vendorId) throw new ForbiddenError('Not your listing\'s review');
    if (!review.vendorResponse) throw new ConflictError('No existing response to update');

    return this.reviewRepo.update(reviewId, {
      'vendorResponse.text': text,
      'vendorResponse.respondedAt': new Date()
    }) as Promise<IReview>;
  }

  // ─── ADMIN METHODS ───

  async getModerationQueue(status: string, page: number, limit: number): Promise<{ reviews: IReview[]; total: number }> {
    return this.reviewRepo.getModerationQueue(status, page, limit);
  }

  async moderateReview(reviewId: string, adminId: string, dto: any): Promise<IReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');

    const updates: any = {
      moderationStatus: dto.status,
      isApproved: dto.status === 'approved',
      moderatedBy: adminId,
      moderatedAt: new Date(),
      moderationReason: dto.reason
    };

    if (dto.status === 'rejected') {
      updates.isApproved = false;
    }

    return this.reviewRepo.update(reviewId, updates) as Promise<IReview>;
  }

  async adminDeleteReview(reviewId: string, adminId: string, reason: string): Promise<void> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');

    await this.reviewRepo.update(reviewId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: adminId,
      moderationStatus: 'rejected',
      moderationReason: reason,
      moderatedBy: adminId,
      moderatedAt: new Date()
    });
  }

  async bulkModerate(reviewIds: string[], action: string, reason: string, adminId: string): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of reviewIds) {
      try {
        if (action === 'approve') {
          await this.moderateReview(id, adminId, { status: 'approved', reason });
        } else if (action === 'reject') {
          await this.moderateReview(id, adminId, { status: 'rejected', reason });
        } else if (action === 'delete') {
          await this.adminDeleteReview(id, adminId, reason);
        } else if (action === 'flag') {
          await this.reviewRepo.update(id, { moderationStatus: 'flagged', moderationReason: reason });
        }
        success.push(id);
      } catch (err: any) {
        failed.push({ id, error: err.message });
      }
    }

    return { success, failed };
  }

  async searchAdminReviews(filters: any): Promise<{ reviews: IReview[]; total: number }> {
    const query: any = { isDeleted: false };
    if (filters.moderationStatus) query.moderationStatus = filters.moderationStatus;
    if (filters.listingId) query.listingId = filters.listingId;
    if (filters.vendorId) query.vendorId = filters.vendorId;
    if (filters.reported) {
      query.$or = [{ reportedCount: { $gt: 0 } }, { moderationStatus: 'flagged' }];
    }
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const [reviews, total] = await Promise.all([
      this.reviewRepo.model.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
      this.reviewRepo.model.countDocuments(query)
    ]);
    return { reviews, total };
  }

  async getReviewStats(): Promise<any> {
    return this.reviewRepo.getReviewStats();
  }
}
