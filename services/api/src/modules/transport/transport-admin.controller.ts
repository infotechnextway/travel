import { Request, Response, NextFunction } from 'express';
import { TransportService } from './transport.service';
import { Listing } from '@modules/listings/listing.model';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';
import { NotFoundError } from '@shared/errors';

export class TransportAdminController {
  constructor(private transportService: TransportService) {}

  getPendingReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.transportService.search({
        status: 'pending_review',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      successResponse(res, result.transports, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  approveTransport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await Listing.findById(req.params.id);
      if (!transport) {
        throw new NotFoundError('Transport not found');
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

  rejectTransport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await Listing.findById(req.params.id);
      if (!transport) {
        throw new NotFoundError('Transport not found');
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

  suspendTransport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await Listing.findById(req.params.id);
      if (!transport) {
        throw new NotFoundError('Transport not found');
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

  getTransportStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalTransports,
        publishedTransports,
        draftTransports,
        pendingReviews,
        suspendedTransports,
        avgPrice,
        byTransportType,
        byDestination,
      ] = await Promise.all([
        Listing.countDocuments({ listingType: 'transport' }).exec(),
        Listing.countDocuments({ listingType: 'transport', status: 'published' }).exec(),
        Listing.countDocuments({ listingType: 'transport', status: 'draft' }).exec(),
        Listing.countDocuments({ listingType: 'transport', status: 'pending_review' }).exec(),
        Listing.countDocuments({ listingType: 'transport', status: 'suspended' }).exec(),
        Listing.aggregate([
          { $match: { listingType: 'transport' } },
          { $group: { _id: null, avg: { $avg: '$pricing.basePrice' } } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'transport' } },
          { $group: { _id: '$transportType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]).exec(),
        Listing.aggregate([
          { $match: { listingType: 'transport' } },
          { $group: { _id: '$destinationId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]).exec(),
      ]);

      successResponse(res, {
        totalTransports,
        status: {
          published: publishedTransports,
          draft: draftTransports,
          pendingReview: pendingReviews,
          suspended: suspendedTransports,
        },
        averagePrice: Math.round((avgPrice[0]?.avg || 0) * 100) / 100,
        byTransportType: byTransportType.reduce((acc: any, curr: any) => {
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
