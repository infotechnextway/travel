import { Router } from 'express';
import { ActivityAdminController } from './activity-admin.controller';
import { ActivityService } from './activity.service';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { Permission } from '@shared/enums';

const activityService = new ActivityService();
const activityAdminController = new ActivityAdminController(activityService);

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_LISTINGS));

router.get('/pending-reviews', activityAdminController.getPendingReviews);
router.get('/stats', activityAdminController.getActivityStats);
router.post('/:id/approve', activityAdminController.approveActivity);
router.post('/:id/reject', activityAdminController.rejectActivity);
router.post('/:id/suspend', activityAdminController.suspendActivity);

export default router;
