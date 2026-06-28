import { Router } from 'express';
import { RewardController } from './reward.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import { BurnPointsDto, ManualRewardDto, RewardSearchDto } from './reward.dto';
import { Permission } from '@shared/enums';

export const createRewardRoutes = (controller: RewardController): Router => {
  const router = Router();

  // ─── CUSTOMER ───
  router.get('/points', authenticate, controller.getMyPoints);
  router.get('/transactions', authenticate, controller.getMyTransactions);
  router.post('/burn', authenticate, validate(BurnPointsDto), controller.burnPoints);

  // ─── ADMIN ───
  router.post('/admin/credit', authenticate, authorize(Permission.MANAGE_REWARDS), validate(ManualRewardDto), controller.manualCredit);
  router.post('/admin/debit', authenticate, authorize(Permission.MANAGE_REWARDS), validate(ManualRewardDto), controller.manualDebit);
  router.post('/admin/expire', authenticate, authorize(Permission.MANAGE_REWARDS), controller.expireOldPoints);
  router.get('/admin/transactions', authenticate, authorize(Permission.MANAGE_REWARDS), validateQuery(RewardSearchDto), controller.getAllTransactions);
  router.get('/admin/top-earners', authenticate, authorize(Permission.MANAGE_REWARDS), controller.getTopEarners);

  return router;
};
