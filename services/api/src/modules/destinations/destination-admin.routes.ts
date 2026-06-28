import { Router } from 'express';
import { DestinationAdminController } from './destination-admin.controller';
import { DestinationService } from './destination.service';
import { DestinationRepository } from './destination.repository';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validation.middleware';
import { CreateDestinationDto, UpdateDestinationDto, ReorderDestinationsDto } from './destination.dto';
import { Permission } from '@shared/enums';

const destinationRepository = new DestinationRepository();
const destinationService = new DestinationService(destinationRepository);
const destinationAdminController = new DestinationAdminController(destinationService);

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_LISTINGS));

router.post('/', validate(CreateDestinationDto), destinationAdminController.create);
router.put('/:id', validate(UpdateDestinationDto), destinationAdminController.update);
router.delete('/:id', destinationAdminController.delete);
router.get('/stats', destinationAdminController.getStats);
router.post('/reorder-featured', validate(ReorderDestinationsDto), destinationAdminController.reorderFeatured);

export default router;
