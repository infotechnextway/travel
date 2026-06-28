import { Router } from 'express';
import { TourController } from './tour.controller';
import { TourService } from './tour.service';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validation.middleware';
import {
  CreateTourDto,
  UpdateTourDto,
  UpdateAvailabilityDto,
  CalculatePriceDto,
} from './tour.dto';
import { Permission } from '@shared/enums';

const tourService = new TourService();
const tourController = new TourController(tourService);

const router = Router();

// Public routes
router.get('/search', tourController.search);
router.get('/:slug', tourController.getBySlug);
router.get('/id/:id', tourController.getById);
router.get('/:id/similar', tourController.getSimilarTours);
router.post('/:id/calculate-price', validate(CalculatePriceDto), tourController.calculatePrice);

// Vendor-protected routes
router.use(authenticate, authorize(Permission.VENDOR_CREATE_LISTING));

router.post('/', validate(CreateTourDto), tourController.create);
router.get('/vendor/my-tours', tourController.getVendorTours);
router.put('/:id', validate(UpdateTourDto), tourController.update);
router.delete('/:id', tourController.delete);
router.put('/:id/availability', validate(UpdateAvailabilityDto), tourController.updateAvailability);
router.post('/:id/submit-review', tourController.submitForReview);

export default router;
