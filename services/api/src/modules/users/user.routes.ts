import { Router } from 'express';
import { userController } from '@shared/container';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  UpdateProfileDto,
  AddressDto,
  KycDocumentDto,
  AvatarUploadDto,
} from './user.dto';
import {
  AdminUpdateUserDto,
  UserSearchDto,
  KycReviewDto,
  BulkActionDto,
} from './admin.dto';
import {
  AddFamilyMemberDto,
  UpdateFamilyMemberDto,
} from './family.dto';
import { Permission } from '@shared/enums';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Profile routes (all authenticated users)
router.get('/me', userController.getProfile);
router.patch('/me', validate(UpdateProfileDto), userController.updateProfile);

// Address routes
router.post('/me/addresses', validate(AddressDto), userController.addAddress);
router.delete('/me/addresses/:id', userController.removeAddress);

// Family member routes
router.post('/me/family', validate(AddFamilyMemberDto), userController.addFamilyMember);
router.patch('/me/family/:id', validate(UpdateFamilyMemberDto), userController.updateFamilyMember);
router.delete('/me/family/:id', userController.removeFamilyMember);

// KYC routes
router.post('/me/documents', validate(KycDocumentDto), userController.uploadKycDocument);
router.delete('/me/documents/:id', userController.removeKycDocument);

// Avatar route
router.post('/me/avatar', validate(AvatarUploadDto), userController.uploadAvatar);

// Admin routes (require MANAGE_USERS permission)
router.get(
  '/admin',
  authorize(Permission.MANAGE_USERS),
  validateQuery(UserSearchDto),
  userController.listUsers
);

router.get(
  '/admin/stats',
  authorize(Permission.MANAGE_USERS),
  userController.getUserStats
);

router.get(
  '/admin/kyc-queue',
  authorize(Permission.MANAGE_USERS),
  userController.getKycQueue
);

router.get(
  '/admin/:id',
  authorize(Permission.MANAGE_USERS),
  userController.getUserById
);

router.patch(
  '/admin/:id',
  authorize(Permission.MANAGE_USERS),
  validate(AdminUpdateUserDto),
  userController.adminUpdateUser
);

router.post(
  '/admin/:id/suspend',
  authorize(Permission.MANAGE_USERS),
  userController.suspendUser
);

router.post(
  '/admin/:id/activate',
  authorize(Permission.MANAGE_USERS),
  userController.activateUser
);

router.post(
  '/admin/:id/kyc-review',
  authorize(Permission.MANAGE_USERS),
  validate(KycReviewDto),
  userController.reviewKyc
);

router.post(
  '/admin/bulk-action',
  authorize(Permission.MANAGE_USERS),
  validate(BulkActionDto),
  userController.bulkAction
);

export default router;
