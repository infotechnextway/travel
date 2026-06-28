import { FilterQuery, SortOrder } from 'mongoose';
import { ReviewModel, IReview } from './review.model';
import { BaseRepository } from '@shared/repository';

export class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(ReviewModel);
  }

  async findByBookingId(bookingId: string): Promise<IReview | null> {
    return this.model.findOne({ bookingId }).lean();
  }

  async findByListingId(
    listingId: string,
    filters: {
      rating?: number;
      hasPhotos?: boolean;
      hasResponse?: boolean;
      sortBy?: 'recent' | 'helpful' | 'highest' | 'lowest';
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: IReview[]; total: number }> {
    const query: FilterQuery<IReview> = {
      listingId,
      isApproved: true,
      isDeleted: false
    };

    if (filters.rating) query.rating = filters.rating;
    if (filters.hasPhotos) query['media.0'] = { $exists: true };
    if (filters.hasResponse) query['vendorResponse.text'] = { $exists: true };

    let sort: { [key: string]: SortOrder } = { createdAt: -1 };
    if (filters.sortBy === 'helpful') sort = { helpfulCount: -1, createdAt: -1 };
    if (filters.sortBy === 'highest') sort = { rating: -1, createdAt: -1 };
    if (filters.sortBy === 'lowest') sort = { rating: 1, createdAt: -1 };

    const [reviews, total] = await Promise.all([
      this.model.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { reviews, total };
  }

  async findByVendorId(vendorId: string, page: number = 1, limit: number = 20): Promise<{ reviews: IReview[]; total: number }> {
    const query = { vendorId, isApproved: true, isDeleted: false };
    const [reviews, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { reviews, total };
  }

  async findByCustomerId(customerId: string, page: number = 1, limit: number = 20): Promise<{ reviews: IReview[]; total: number }> {
    const [reviews, total] = await Promise.all([
      this.model.find({ customerId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments({ customerId })
    ]);
    return { reviews, total };
  }

  async getModerationQueue(status: string = 'pending', page: number = 1, limit: number = 50): Promise<{ reviews: IReview[]; total: number }> {
    const query: FilterQuery<IReview> = { moderationStatus: status, isDeleted: false };
    if (status === 'flagged') {
      query.$or = [{ moderationStatus: 'flagged' }, { reportedCount: { $gt: 0 } }];
    }
    const [reviews, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return { reviews, total };
  }

  async getListingRatingSummary(listingId: string): Promise<any> {
    const result = await this.model.aggregate([
      { $match: { listingId, isApproved: true, isDeleted: false } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          avgCleanliness: { $avg: '$dimensions.cleanliness' },
          avgValue: { $avg: '$dimensions.value' },
          avgCommunication: { $avg: '$dimensions.communication' },
          avgLocation: { $avg: '$dimensions.location' },
          avgAccuracy: { $avg: '$dimensions.accuracy' },
          avgService: { $avg: '$dimensions.service' },
          avgAmenities: { $avg: '$dimensions.amenities' },
          fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          withPhotos: { $sum: { $cond: [{ $gt: [{ $size: '$media' }, 0] }, 1, 0] } },
          withResponse: { $sum: { $cond: [{ $ifNull: ['$vendorResponse.text', false] }, 1, 0] } }
        }
      }
    ]);

    return result[0] || {
      averageRating: 0, totalReviews: 0,
      avgCleanliness: 0, avgValue: 0, avgCommunication: 0,
      avgLocation: 0, avgAccuracy: 0, avgService: 0, avgAmenities: 0,
      fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0,
      withPhotos: 0, withResponse: 0
    };
  }

  async getVendorRatingSummary(vendorId: string): Promise<any> {
    const result = await this.model.aggregate([
      { $match: { vendorId, isApproved: true, isDeleted: false } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          avgCleanliness: { $avg: '$dimensions.cleanliness' },
          avgValue: { $avg: '$dimensions.value' },
          avgCommunication: { $avg: '$dimensions.communication' },
          avgService: { $avg: '$dimensions.service' },
          responseRate: { $avg: { $cond: [{ $ifNull: ['$vendorResponse.text', false] }, 1, 0] } }
        }
      }
    ]);
    return result[0] || { averageRating: 0, totalReviews: 0, responseRate: 0 };
  }

  async hasUserReviewed(userId: string, bookingId: string): Promise<boolean> {
    const count = await this.model.countDocuments({ customerId: userId, bookingId });
    return count > 0;
  }

  async getUserVote(reviewId: string, userId: string): Promise<IReview['helpfulVotes'][0] | null> {
    const review = await this.model.findOne(
      { _id: reviewId, 'helpfulVotes.userId': userId },
      { 'helpfulVotes.$': 1 }
    ).lean();
    return review?.helpfulVotes?.[0] || null;
  }

  async addVote(reviewId: string, userId: string, isHelpful: boolean): Promise<void> {
    await this.model.updateOne(
      { _id: reviewId },
      {
        $push: { helpfulVotes: { userId, isHelpful, createdAt: new Date() } },
        $inc: { helpfulCount: isHelpful ? 1 : 0, unhelpfulCount: isHelpful ? 0 : 1 }
      }
    );
  }

  async removeVote(reviewId: string, userId: string, wasHelpful: boolean): Promise<void> {
    await this.model.updateOne(
      { _id: reviewId },
      {
        $pull: { helpfulVotes: { userId } },
        $inc: { helpfulCount: wasHelpful ? -1 : 0, unhelpfulCount: wasHelpful ? 0 : -1 }
      }
    );
  }

  async updateVote(reviewId: string, userId: string, oldHelpful: boolean, newHelpful: boolean): Promise<void> {
    await this.removeVote(reviewId, userId, oldHelpful);
    await this.addVote(reviewId, userId, newHelpful);
  }

  async getReviewStats(): Promise<any> {
    const [total, byStatus, byRating, pendingMod, flagged] = await Promise.all([
      this.model.countDocuments({ isDeleted: false }),
      this.model.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$moderationStatus', count: { $sum: 1 } } }]),
      this.model.aggregate([{ $match: { isApproved: true, isDeleted: false } }, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
      this.model.countDocuments({ moderationStatus: 'pending', isDeleted: false }),
      this.model.countDocuments({ $or: [{ moderationStatus: 'flagged' }, { reportedCount: { $gt: 0 } }], isDeleted: false })
    ]);

    return {
      totalReviews: total,
      byStatus: byStatus.reduce((a: any, s: any) => ({ ...a, [s._id]: s.count }), {}),
      byRating: byRating.reduce((a: any, s: any) => ({ ...a, [s._id]: s.count }), {}),
      pendingModeration: pendingMod,
      flaggedReviews: flagged
    };
  }
}
