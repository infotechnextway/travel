import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validation.middleware';
import {
  CreateActivityDto,
  UpdateActivityDto,
  UpdateActivityAvailabilityDto,
  CalculateActivityPriceDto,
} from './activity.dto';
import { Permission } from '@shared/enums';

const activityService = new ActivityService();
const activityController = new ActivityController(activityService);

const router = Router();

// Public routes
router.get('/search', activityController.search);
router.get('/:slug', activityController.getBySlug);
router.get('/id/:id', activityController.getById);
router.get('/:id/similar', activityController.getSimilarActivities);
router.post('/:id/calculate-price', validate(CalculateActivityPriceDto), activityController.calculatePrice);
router.post('/:id/weather-check', activityController.checkWeather);

// Vendor-protected routes
router.use(authenticate, authorize(Permission.VENDOR_CREATE_LISTING));

router.post('/', validate(CreateActivityDto), activityController.create);
router.get('/vendor/my-activities', activityController.getVendorActivities);
router.put('/:id', validate(UpdateActivityDto), activityController.update);
router.delete('/:id', activityController.delete);
router.put('/:id/availability', validate(UpdateActivityAvailabilityDto), activityController.updateAvailability);
router.post('/:id/submit-review', activityController.submitForReview);

export default router;
