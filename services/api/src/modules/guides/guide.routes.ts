import { Router } from 'express';
import { guideController } from '@shared/container';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  RegisterGuideDto,
  UpdateGuideProfileDto,
  CertificationDto,
  AvailabilityDto,
  GuideSearchDto,
  ReviewGuideDto,
  BulkGuideActionDto,
  AssignmentResponseDto,
} from './guide.dto';
import { Permission } from '@shared/enums';

const router = Router();

// Public guide discovery
router.get('/public/available', validateQuery(GuideSearchDto), guideController.findAvailableGuides);
router.get('/public/:id', guideController.getGuideById);

// Guide routes (require authentication)
router.use(authenticate);

// Registration & profile (guide role)
router.post('/register', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), validate(RegisterGuideDto), guideController.registerGuide);
router.get('/me', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), guideController.getGuideProfile);
router.patch('/me', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), validate(UpdateGuideProfileDto), guideController.updateGuideProfile);

// Certifications
router.post('/me/certifications', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), validate(CertificationDto), guideController.addCertification);
router.delete('/me/certifications/:id', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), guideController.removeCertification);

// Availability calendar
router.post('/me/availability', authorize(Permission.GUIDE_UPDATE_AVAILABILITY), validate(AvailabilityDto), guideController.updateAvailability);
router.get('/me/availability', authorize(Permission.GUIDE_UPDATE_AVAILABILITY), guideController.getAvailability);

// Assignments
router.get('/me/assignments', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), guideController.getAssignments);
router.post('/me/assignments/:id/respond', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), validate(AssignmentResponseDto), guideController.respondToAssignment);

// Earnings
router.get('/me/earnings', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), guideController.getEarnings);
router.get('/me/earnings/summary', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), guideController.getEarningsSummary);

// Ratings
router.get('/me/ratings', authorize(Permission.GUIDE_VIEW_ASSIGNMENTS), guideController.getRatingAggregation);

// Admin guide management (admin permission required)
router.get('/admin', authorize(Permission.MANAGE_GUIDES), validateQuery(GuideSearchDto), guideController.listGuides);
router.get('/admin/stats', authorize(Permission.MANAGE_GUIDES), guideController.getGuideStats);
router.get('/admin/verification-queue', authorize(Permission.MANAGE_GUIDES), guideController.getPendingVerificationQueue);
router.get('/admin/:id', authorize(Permission.MANAGE_GUIDES), guideController.getGuideById);
router.patch('/admin/:id/review', authorize(Permission.MANAGE_GUIDES), validate(ReviewGuideDto), guideController.reviewGuide);
router.post('/admin/:id/suspend', authorize(Permission.MANAGE_GUIDES), guideController.suspendGuide);
router.post('/admin/:id/activate', authorize(Permission.MANAGE_GUIDES), guideController.activateGuide);
router.post('/admin/bulk-action', authorize(Permission.MANAGE_GUIDES), validate(BulkGuideActionDto), guideController.bulkAction);

export default router;
