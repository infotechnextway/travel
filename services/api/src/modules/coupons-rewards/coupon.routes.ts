import { Router } from 'express';
import { CouponController } from './coupon.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  CreateCouponDto, UpdateCouponDto, ValidateCouponDto, CouponSearchDto, BulkCouponActionDto
} from './coupon.dto';
import { Permission } from '@shared/enums';

export const createCouponRoutes = (controller: CouponController): Router => {
  const router = Router();

  // ─── CUSTOMER ───
  router.post('/validate', authenticate, validate(ValidateCouponDto), controller.validateCoupon);
  router.post('/apply/:bookingId', authenticate, controller.applyCoupon);
  router.delete('/remove/:bookingId', authenticate, controller.removeCoupon);
  router.get('/available', authenticate, controller.getAvailableCoupons);

  // ─── ADMIN ───
  router.post('/admin', authenticate, authorize(Permission.MANAGE_COUPONS), validate(CreateCouponDto), controller.createCoupon);
  router.patch('/admin/:id', authenticate, authorize(Permission.MANAGE_COUPONS), validate(UpdateCouponDto), controller.updateCoupon);
  router.delete('/admin/:id', authenticate, authorize(Permission.MANAGE_COUPONS), controller.deleteCoupon);
  router.get('/admin/:id', authenticate, authorize(Permission.MANAGE_COUPONS), controller.getCouponById);
  router.get('/admin', authenticate, authorize(Permission.MANAGE_COUPONS), validateQuery(CouponSearchDto), controller.searchCoupons);
  router.get('/admin/:id/stats', authenticate, authorize(Permission.MANAGE_COUPONS), controller.getCouponStats);
  router.post('/admin/bulk-action', authenticate, authorize(Permission.MANAGE_COUPONS), validate(BulkCouponActionDto), controller.bulkAction);

  return router;
};
