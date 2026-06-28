import { Router } from 'express';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validation.middleware';
import {
  CreateTransportDto,
  UpdateTransportDto,
  CalculateTransportPriceDto,
  UpdateFleetStatusDto,
  TrackLocationDto,
} from './transport.dto';
import { Permission } from '@shared/enums';

const transportService = new TransportService();
const transportController = new TransportController(transportService);

const router = Router();

// Public routes
router.get('/search', transportController.search);
router.get('/:slug', transportController.getBySlug);
router.get('/id/:id', transportController.getById);
router.get('/:id/similar', transportController.getSimilarTransports);
router.post('/:id/calculate-price', validate(CalculateTransportPriceDto), transportController.calculatePrice);
router.get('/:id/location', transportController.getLocationHistory);

// Vendor-protected routes
router.use(authenticate, authorize(Permission.VENDOR_CREATE_LISTING));

router.post('/', validate(CreateTransportDto), transportController.create);
router.get('/vendor/my-transports', transportController.getVendorTransports);
router.put('/:id', validate(UpdateTransportDto), transportController.update);
router.delete('/:id', transportController.delete);
router.put('/:id/fleet-status', validate(UpdateFleetStatusDto), transportController.updateFleetStatus);
router.post('/:id/location', validate(TrackLocationDto), transportController.updateLocation);
router.post('/:id/submit-review', transportController.submitForReview);
router.get('/:id/fleet-utilization', transportController.getFleetUtilization);

export default router;
