import { Request, Response, NextFunction } from 'express';
import { HotelService } from './hotel.service';
import { Listing } from '@modules/listings/listing.model';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';
import { NotFoundError } from '@shared/errors';

export class HotelAdminController {
  constructor(private hotelService: HotelService) {}

  getPendingReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.hotelService.search({
        status: 'pending_review',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      successResponse(res, result.hotels, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  approveHotel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await Listing.findById(req.params.id);
      if (!hotel) {
        throw new NotFoundError('Hotel not found');
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

  rejectHotel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await Listing.findById(req.params.id);
      if (!hotel) {
        throw new NotFoundError('Hotel not found');
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

  suspendHotel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await Listing.findById(req.params.id);
      if (!hotel) {
        throw new NotFoundError('Hotel not found');
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

  getHotelStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalHotels,
        publishedHotels,
        draftHotels,
        pendingReviews,
        suspendedHotels,
        avgPrice,
        avgStarRating,
        byPropertyType,
        byDestination,
      ] = await Promise.all([
        Listing.countDocuments({ listingType: 'hotel' }).exec(),
        Listing.countDocuments({ listingType: 'hotel', status: 'published' }).exec(),
        Listing.countDocuments({ listingType: 'hotel', status: 'draft' }).exec(),
        Listing.countDocuments({ listingType: 'hotel', status: 'pending_review' }).exec(),
        Listing.countDocuments({ listingType: 'hotel', status: 'suspended' }).exec(),
        Listing.aggregate([
          { $match: { listingType: 'hotel' } },
          { $group: { _id: null, avg: { $avg: '$pricing.basePrice' } } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'hotel', starRating: { $exists: true } } },
          { $group: { _id: null, avg: { $avg: '$starRating' } } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'hotel' } },
          { $group: { _id: '$propertyType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'hotel' } },
          { $group: { _id: '$destinationId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]).exec(),
      ]);

      successResponse(res, {
        totalHotels,
        status: {
          published: publishedHotels,
          draft: draftHotels,
          pendingReview: pendingReviews,
          suspended: suspendedHotels,
        },
        averagePrice: Math.round((avgPrice[0]?.avg || 0) * 100) / 100,
        averageStarRating: Math.round((avgStarRating[0]?.avg || 0) * 10) / 10,
        byPropertyType: byPropertyType.reduce((acc: any, curr: any) => {
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
