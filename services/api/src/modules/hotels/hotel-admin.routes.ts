import { Router } from 'express';
import { HotelAdminController } from './hotel-admin.controller';
import { HotelService } from './hotel.service';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { Permission } from '@shared/enums';

const hotelService = new HotelService();
const hotelAdminController = new HotelAdminController(hotelService);

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_LISTINGS));

router.get('/pending-reviews', hotelAdminController.getPendingReviews);
router.get('/stats', hotelAdminController.getHotelStats);
router.post('/:id/approve', hotelAdminController.approveHotel);
router.post('/:id/reject', hotelAdminController.rejectHotel);
router.post('/:id/suspend', hotelAdminController.suspendHotel);

export default router;
