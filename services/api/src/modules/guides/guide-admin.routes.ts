import { Router } from 'express';
import { GuideAdminController } from './guide-admin.controller';
import { GuideService } from './guide.service';
import { GuideRepository } from './guide.repository';
import { UserRepository } from '@modules/users/user.repository';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validateQuery } from '@shared/middleware/validation.middleware';
import { GuideSearchDto } from './guide.dto';
import { Permission } from '@shared/enums';

const guideRepository = new GuideRepository();
const userRepository = new UserRepository();
const guideService = new GuideService(guideRepository, userRepository);
const guideAdminController = new GuideAdminController(guideService);

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_GUIDES));

router.get('/search', validateQuery(GuideSearchDto), guideAdminController.searchGuides);
router.get('/stats', guideAdminController.getGuideStats);
router.patch('/:id/verification', guideAdminController.updateVerificationStatus);
router.patch('/:id/certifications', guideAdminController.verifyCertification);

export default router;
