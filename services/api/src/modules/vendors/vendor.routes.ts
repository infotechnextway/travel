import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { VendorRepository } from './vendor.repository';
import { UserRepository } from '@modules/users/user.repository';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validation.middleware';
import {
  OnboardingDto,
  UpdateProfileDto,
  BankDetailsDto,
  PayoutScheduleDto,
  DocumentUploadDto,
} from './vendor.dto';
import { Permission } from '@shared/enums';

const vendorRepository = new VendorRepository();
const userRepository = new UserRepository();
const vendorService = new VendorService(vendorRepository, userRepository);
const vendorController = new VendorController(vendorService);

const router = Router();

// Public routes
router.get('/public/:slug', vendorController.getPublicProfile);

// Vendor-protected routes
router.use(authenticate, authorize(Permission.VENDOR_CREATE_LISTING));

router.post('/onboard', validate(OnboardingDto), vendorController.onboard);
router.get('/me', vendorController.getProfile);
router.patch('/me', validate(UpdateProfileDto), vendorController.updateProfile);
router.put('/me/bank-details', validate(BankDetailsDto), vendorController.updateBankDetails);
router.put('/me/payout-schedule', validate(PayoutScheduleDto), vendorController.updatePayoutSchedule);
router.post('/me/documents', validate(DocumentUploadDto), vendorController.uploadDocument);
router.get('/me/dashboard', vendorController.getDashboard);

export default router;
