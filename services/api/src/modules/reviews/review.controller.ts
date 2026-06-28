import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  // ─── CUSTOMER ───

  createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await this.reviewService.createReview(req.user.userId, req.body);
      successResponse(res, 201, review, 'Review submitted and pending moderation');
    } catch (err) { next(err); }
  };

  updateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await this.reviewService.updateReview(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, review, 'Review updated');
    } catch (err) { next(err); }
  };

  deleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.reviewService.deleteReview(req.params.id, req.user.userId);
      successResponse(res, 200, null, 'Review deleted');
    } catch (err) { next(err); }
  };

  getMyReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.reviewService.getMyReviews(req.user.userId, page, limit);
      successResponse(res, 200, result.reviews, 'My reviews retrieved', { page, limit, total: result.total });
    } catch (err) { next(err); }
  };

  // ─── PUBLIC ───

  getListingReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        hasPhotos: req.query.hasPhotos === 'true' ? true : undefined,
        hasResponse: req.query.hasResponse === 'true' ? true : undefined,
        sortBy: req.query.sortBy as any,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.reviewService.getListingReviews(req.params.listingId, filters);
      successResponse(res, 200, result.reviews, 'Reviews retrieved', { page: filters.page, limit: filters.limit, total: result.total }, result.summary);
    } catch (err) { next(err); }
  };

  getReviewById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await this.reviewService.getReviewById(req.params.id);
      successResponse(res, 200, review, 'Review retrieved');
    } catch (err) { next(err); }
  };

  voteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.reviewService.voteReview(req.params.id, req.user.userId, req.body.isHelpful);
      successResponse(res, 200, result, 'Vote recorded');
    } catch (err) { next(err); }
  };

  reportReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.reviewService.reportReview(req.params.id, req.user.userId, req.body.reason);
      successResponse(res, 200, null, 'Review reported for moderation');
    } catch (err) { next(err); }
  };

  // ─── VENDOR ───

  getVendorReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.reviewService.getVendorReviews(req.user.userId, page, limit);
      successResponse(res, 200, result.reviews, 'Vendor reviews retrieved', { page, limit, total: result.total }, result.summary);
    } catch (err) { next(err); }
  };

  respondToReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await this.reviewService.respondToReview(req.params.id, req.user.userId, req.body.text);
      successResponse(res, 200, review, 'Response submitted');
    } catch (err) { next(err); }
  };

  updateVendorResponse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await this.reviewService.updateVendorResponse(req.params.id, req.user.userId, req.body.text);
      successResponse(res, 200, review, 'Response updated');
    } catch (err) { next(err); }
  };

  // ─── ADMIN ───

  getModerationQueue = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const status = (req.query.status as string) || 'pending';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await this.reviewService.getModerationQueue(status, page, limit);
      successResponse(res, 200, result.reviews, 'Moderation queue', { page, limit, total: result.total });
    } catch (err) { next(err); }
  };

  moderateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await this.reviewService.moderateReview(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, review, `Review ${req.body.status}`);
    } catch (err) { next(err); }
  };

  adminDeleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.reviewService.adminDeleteReview(req.params.id, req.user.userId, req.body.reason);
      successResponse(res, 200, null, 'Review deleted by admin');
    } catch (err) { next(err); }
  };

  searchAdminReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        moderationStatus: req.query.moderationStatus as any,
        listingId: req.query.listingId as string,
        vendorId: req.query.vendorId as string,
        search: req.query.search as string,
        reported: req.query.reported === 'true',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.reviewService.searchAdminReviews(filters);
      successResponse(res, 200, result.reviews, 'Reviews retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  bulkModerate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.reviewService.bulkModerate(req.body.reviewIds, req.body.action, req.body.reason, req.user.userId);
      successResponse(res, 200, result, 'Bulk moderation completed');
    } catch (err) { next(err); }
  };

  getReviewStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.reviewService.getReviewStats();
      successResponse(res, 200, stats, 'Review statistics');
    } catch (err) { next(err); }
  };
}
