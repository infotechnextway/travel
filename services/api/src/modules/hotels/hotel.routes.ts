import { Router } from 'express';
import { HotelController } from './hotel.controller';
import { HotelService } from './hotel.service';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validation.middleware';
import {
  CreateHotelDto,
  UpdateHotelDto,
  UpdateRoomAvailabilityDto,
  CalculateHotelPriceDto,
} from './hotel.dto';
import { Permission } from '@shared/enums';

const hotelService = new HotelService();
const hotelController = new HotelController(hotelService);

const router = Router();

// Public routes
router.get('/search', hotelController.search);
router.get('/:slug', hotelController.getBySlug);
router.get('/id/:id', hotelController.getById);
router.get('/:id/similar', hotelController.getSimilarHotels);
router.post('/:id/calculate-price', validate(CalculateHotelPriceDto), hotelController.calculatePrice);

// Vendor-protected routes
router.use(authenticate, authorize(Permission.VENDOR_CREATE_LISTING));

router.post('/', validate(CreateHotelDto), hotelController.create);
router.get('/vendor/my-hotels', hotelController.getVendorHotels);
router.put('/:id', validate(UpdateHotelDto), hotelController.update);
router.delete('/:id', hotelController.delete);
router.put('/:id/room-availability', validate(UpdateRoomAvailabilityDto), hotelController.updateRoomAvailability);
router.post('/:id/submit-review', hotelController.submitForReview);

export default router;
