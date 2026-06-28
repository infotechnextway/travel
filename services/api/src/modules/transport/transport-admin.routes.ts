import { Router } from 'express';
import { TransportAdminController } from './transport-admin.controller';
import { TransportService } from './transport.service';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { Permission } from '@shared/enums';

const transportService = new TransportService();
const transportAdminController = new TransportAdminController(transportService);

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_LISTINGS));

router.get('/pending-reviews', transportAdminController.getPendingReviews);
router.get('/stats', transportAdminController.getTransportStats);
router.post('/:id/approve', transportAdminController.approveTransport);
router.post('/:id/reject', transportAdminController.rejectTransport);
router.post('/:id/suspend', transportAdminController.suspendTransport);

export default router;
