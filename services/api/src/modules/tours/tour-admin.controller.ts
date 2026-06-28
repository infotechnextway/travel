import { Request, Response, NextFunction } from 'express';
import { TourService } from './tour.service';
import { Listing } from '@modules/listings/listing.model';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';
import { NotFoundError } from '@shared/errors';

export class TourAdminController {
  constructor(private tourService: TourService) {}

  getPendingReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.tourService.search({
        status: 'pending_review',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      successResponse(res, result.tours, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  approveTour = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tour = await Listing.findById(req.params.id);
      if (!tour) {
        throw new NotFoundError('Tour not found');
      }

      const updated = await Listing.findByIdAndUpdate(
        req.params.id,
        {
          status: 'published',
          isVerified: true,
          'metadata.approvedBy': req.user!.userId,
          'metadata.approvedAt': new Date(),
        },
        { new: true }
      ).exec();

      successResponse(res, updated);
    } catch (error) {
      next(error);
    }
  };

  rejectTour = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tour = await Listing.findById(req.params.id);
      if (!tour) {
        throw new NotFoundError('Tour not found');
      }

      const updated = await Listing.findByIdAndUpdate(
        req.params.id,
        {
          status: 'draft',
          'metadata.rejectedBy': req.user!.userId,
          'metadata.rejectedAt': new Date(),
          'metadata.rejectionReason': req.body.reason || 'Content does not meet platform standards',
        },
        { new: true }
      ).exec();

      successResponse(res, updated);
    } catch (error) {
      next(error);
    }
  };

  suspendTour = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tour = await Listing.findById(req.params.id);
      if (!tour) {
        throw new NotFoundError('Tour not found');
      }

      const updated = await Listing.findByIdAndUpdate(
        req.params.id,
        {
          status: 'suspended',
          'metadata.suspendedBy': req.user!.userId,
          'metadata.suspendedAt': new Date(),
          'metadata.suspensionReason': req.body.reason || 'Policy violation',
        },
        { new: true }
      ).exec();

      successResponse(res, updated);
    } catch (error) {
      next(error);
    }
  };

  getTourStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalTours,
        publishedTours,
        draftTours,
        pendingReviews,
        suspendedTours,
        avgPrice,
        avgDuration,
        byDifficulty,
        byDestination,
      ] = await Promise.all([
        Listing.countDocuments({ listingType: 'tour' }).exec(),
        Listing.countDocuments({ listingType: 'tour', status: 'published' }).exec(),
        Listing.countDocuments({ listingType: 'tour', status: 'draft' }).exec(),
        Listing.countDocuments({ listingType: 'tour', status: 'pending_review' }).exec(),
        Listing.countDocuments({ listingType: 'tour', status: 'suspended' }).exec(),
        Listing.aggregate([
          { $match: { listingType: 'tour' } },
          { $group: { _id: null, avg: { $avg: '$pricing.basePrice' } } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'tour' } },
          { $group: { _id: null, avg: { $avg: '$durationDays' } } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'tour' } },
          { $group: { _id: '$difficulty', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'tour' } },
          { $group: { _id: '$destinationId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]).exec(),
      ]);

      successResponse(res, {
        totalTours,
        status: {
          published: publishedTours,
          draft: draftTours,
          pendingReview: pendingReviews,
          suspended: suspendedTours,
        },
        averagePrice: Math.round((avgPrice[0]?.avg || 0) * 100) / 100,
        averageDuration: Math.round((avgDuration[0]?.avg || 0) * 10) / 10,
        byDifficulty: byDifficulty.reduce((acc: any, curr: any) => {
          acc[curr._id || 'unknown'] = curr.count;
          return acc;
        }, {}),
        topDestinations: byDestination,
      });
    } catch (error) {
      next(error);
    }
  };
}
