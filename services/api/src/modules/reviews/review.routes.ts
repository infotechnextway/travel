import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  CreateReviewDto, UpdateReviewDto, VendorResponseDto, ModerateReviewDto,
  ReportReviewDto, VoteReviewDto, ReviewSearchDto, AdminReviewSearchDto, BulkReviewActionDto
} from './review.dto';
import { Permission } from '@shared/enums';

export const createReviewRoutes = (controller: ReviewController): Router => {
  const router = Router();

  // ─── CUSTOMER ───
  router.post('/', authenticate, validate(CreateReviewDto), controller.createReview);
  router.patch('/:id', authenticate, validate(UpdateReviewDto), controller.updateReview);
  router.delete('/:id', authenticate, controller.deleteReview);
  router.get('/my', authenticate, controller.getMyReviews);

  // ─── PUBLIC ───
  router.get('/listing/:listingId', validateQuery(ReviewSearchDto), controller.getListingReviews);
  router.get('/:id', controller.getReviewById);
  router.post('/:id/vote', authenticate, validate(VoteReviewDto), controller.voteReview);
  router.post('/:id/report', authenticate, validate(ReportReviewDto), controller.reportReview);

  // ─── VENDOR ───
  router.get('/vendor/my', authenticate, authorize(Permission.VENDOR_CREATE_LISTING), controller.getVendorReviews);
  router.post('/vendor/:id/respond', authenticate, authorize(Permission.VENDOR_CREATE_LISTING), validate(VendorResponseDto), controller.respondToReview);
  router.patch('/vendor/:id/respond', authenticate, authorize(Permission.VENDOR_CREATE_LISTING), validate(VendorResponseDto), controller.updateVendorResponse);

  // ─── ADMIN ───
  router.get('/admin/moderation-queue', authenticate, authorize(Permission.MANAGE_REVIEWS), controller.getModerationQueue);
  router.post('/admin/:id/moderate', authenticate, authorize(Permission.MANAGE_REVIEWS), validate(ModerateReviewDto), controller.moderateReview);
  router.delete('/admin/:id', authenticate, authorize(Permission.MANAGE_REVIEWS), controller.adminDeleteReview);
  router.get('/admin/search', authenticate, authorize(Permission.MANAGE_REVIEWS), validateQuery(AdminReviewSearchDto), controller.searchAdminReviews);
  router.post('/admin/bulk-action', authenticate, authorize(Permission.MANAGE_REVIEWS), validate(BulkReviewActionDto), controller.bulkModerate);
  router.get('/admin/stats', authenticate, authorize(Permission.MANAGE_REVIEWS), controller.getReviewStats);

  return router;
};
