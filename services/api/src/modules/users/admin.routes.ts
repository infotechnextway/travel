import { Router } from 'express';
import { AdminUserController } from './admin.controller';
import { AdminUserService } from './admin.service';
import { UserRepository } from './user.repository';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import { UserSearchDto, UpdateUserStatusDto, KycVerifyDto, BulkUserActionDto } from './admin.dto';
import { Permission } from '@shared/enums';

const adminUserService = new AdminUserService(new UserRepository());
const adminUserController = new AdminUserController(adminUserService);

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_USERS));

router.get('/search', validateQuery(UserSearchDto), adminUserController.searchUsers);
router.get('/stats', adminUserController.getUserStats);
router.get('/kyc-queue', validateQuery(UserSearchDto), adminUserController.getKycQueue);
router.get('/:id', adminUserController.getUserById);
router.patch('/:id/status', validate(UpdateUserStatusDto), adminUserController.updateUserStatus);
router.patch('/:id/kyc', validate(KycVerifyDto), adminUserController.verifyKyc);
router.post('/bulk-action', validate(BulkUserActionDto), adminUserController.bulkAction);

export default router;
