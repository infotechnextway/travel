import { Router } from 'express';
import { TourAdminController } from './tour-admin.controller';
import { TourService } from './tour.service';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { Permission } from '@shared/enums';

const tourService = new TourService();
const tourAdminController = new TourAdminController(tourService);

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_LISTINGS));

router.get('/pending-reviews', tourAdminController.getPendingReviews);
router.get('/stats', tourAdminController.getTourStats);
router.post('/:id/approve', tourAdminController.approveTour);
router.post('/:id/reject', tourAdminController.rejectTour);
router.post('/:id/suspend', tourAdminController.suspendTour);

export default router;
