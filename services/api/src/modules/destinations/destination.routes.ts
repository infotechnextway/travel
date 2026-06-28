import { Router } from 'express';
import { destinationController } from '@shared/container';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
  DestinationSearchDto,
  UpdateContentDto,
  UpdateWeatherDto,
  BulkDestinationActionDto,
} from './destination.dto';
import { Permission } from '@shared/enums';

const router = Router();

// Public routes (no auth required)
router.get('/', validateQuery(DestinationSearchDto), destinationController.getAllDestinations);
router.get('/featured', destinationController.getFeaturedDestinations);
router.get('/nearby', destinationController.getNearbyDestinations);
router.get('/hierarchy', destinationController.getHierarchy);
router.get('/map', destinationController.getMapData);
router.get('/map/state/:slug', destinationController.getStateMapData);
router.get('/slug/:slug', destinationController.getDestinationBySlug);
router.get('/:id', destinationController.getDestinationById);
router.get('/:id/children', destinationController.getChildren);
router.get('/:id/breadcrumb', destinationController.getBreadcrumb);
router.get('/:id/weather', destinationController.getWeatherInfo);

// Admin routes (require authentication and CMS permission)
router.use(authenticate);

router.post(
  '/admin',
  authorize(Permission.MANAGE_CMS),
  validate(CreateDestinationDto),
  destinationController.createDestination
);

router.patch(
  '/admin/:id',
  authorize(Permission.MANAGE_CMS),
  validate(UpdateDestinationDto),
  destinationController.updateDestination
);

router.delete(
  '/admin/:id',
  authorize(Permission.MANAGE_CMS),
  destinationController.deleteDestination
);

router.patch(
  '/admin/:id/content',
  authorize(Permission.MANAGE_CMS),
  validate(UpdateContentDto),
  destinationController.updateContent
);

router.patch(
  '/admin/:id/weather',
  authorize(Permission.MANAGE_CMS),
  validate(UpdateWeatherDto),
  destinationController.updateWeather
);

router.post(
  '/admin/bulk-action',
  authorize(Permission.MANAGE_CMS),
  validate(BulkDestinationActionDto),
  destinationController.bulkAction
);

router.get(
  '/admin/stats',
  authorize(Permission.MANAGE_CMS),
  destinationController.getDestinationStats
);

export default router;
