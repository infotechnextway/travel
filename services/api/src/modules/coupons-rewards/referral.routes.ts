import { Router } from 'express';
import { ReferralController } from './referral.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import { ApplyReferralDto, UpdateReferralBonusDto, ReferralSearchDto } from './referral.dto';
import { Permission } from '@shared/enums';

export const createReferralRoutes = (controller: ReferralController): Router => {
  const router = Router();

  // ─── CUSTOMER ───
  router.get('/my-code', authenticate, controller.getMyReferralCode);
  router.get('/my-referrals', authenticate, controller.getMyReferrals);
  router.post('/apply', authenticate, validate(ApplyReferralDto), controller.applyReferralCode);

  // ─── ADMIN ───
  router.get('/admin', authenticate, authorize(Permission.MANAGE_REWARDS), validateQuery(ReferralSearchDto), controller.searchReferrals);
  router.patch('/admin/:id/bonus', authenticate, authorize(Permission.MANAGE_REWARDS), validate(UpdateReferralBonusDto), controller.updateBonusSettings);
  router.get('/admin/stats', authenticate, authorize(Permission.MANAGE_REWARDS), controller.getPlatformStats);
  router.post('/admin/expire-pending', authenticate, authorize(Permission.MANAGE_REWARDS), controller.expirePending);

  return router;
};
