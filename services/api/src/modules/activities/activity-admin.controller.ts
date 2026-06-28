import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service';
import { Listing } from '@modules/listings/listing.model';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';
import { NotFoundError } from '@shared/errors';

export class ActivityAdminController {
  constructor(private activityService: ActivityService) {}

  getPendingReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.activityService.search({
        status: 'pending_review',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      successResponse(res, result.activities, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  approveActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await Listing.findById(req.params.id);
      if (!activity) {
        throw new NotFoundError('Activity not found');
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

  rejectActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await Listing.findById(req.params.id);
      if (!activity) {
        throw new NotFoundError('Activity not found');
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

  suspendActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await Listing.findById(req.params.id);
      if (!activity) {
        throw new NotFoundError('Activity not found');
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

  getActivityStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalActivities,
        publishedActivities,
        draftActivities,
        pendingReviews,
        suspendedActivities,
        avgPrice,
        avgDuration,
        byCategory,
        byDifficulty,
        byDestination,
      ] = await Promise.all([
        Listing.countDocuments({ listingType: 'activity' }).exec(),
        Listing.countDocuments({ listingType: 'activity', status: 'published' }).exec(),
        Listing.countDocuments({ listingType: 'activity', status: 'draft' }).exec(),
        Listing.countDocuments({ listingType: 'activity', status: 'pending_review' }).exec(),
        Listing.countDocuments({ listingType: 'activity', status: 'suspended' }).exec(),
        Listing.aggregate([
          { $match: { listingType: 'activity' } },
          { $group: { _id: null, avg: { $avg: '$pricing.basePrice' } } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'activity' } },
          { $group: { _id: null, avg: { $avg: '$durationHours' } } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'activity' } },
          { $group: { _id: '$activityCategory', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'activity' } },
          { $group: { _id: '$difficulty', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'activity' } },
          { $group: { _id: '$destinationId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]).exec(),
      ]);

      successResponse(res, {
        totalActivities,
        status: {
          published: publishedActivities,
          draft: draftActivities,
          pendingReview: pendingReviews,
          suspended: suspendedActivities,
        },
        averagePrice: Math.round((avgPrice[0]?.avg || 0) * 100) / 100,
        averageDuration: Math.round((avgDuration[0]?.avg || 0) * 10) / 10,
        byCategory: byCategory.reduce((acc: any, curr: any) => {
          acc[curr._id || 'unknown'] = curr.count;
          return acc;
        }, {}),
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
