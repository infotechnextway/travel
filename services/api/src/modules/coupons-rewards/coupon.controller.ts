import { Request, Response, NextFunction } from 'express';
import { CouponService } from './coupon.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class CouponController {
  constructor(private couponService: CouponService) {}

  // ─── CUSTOMER ───

  validateCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.couponService.validateCoupon(
        req.body.code,
        req.body.listingId,
        req.body.listingType,
        req.body.vendorId,
        req.body.amount,
        req.user.userId
      );
      successResponse(res, 200, result, result.valid ? 'Coupon is valid' : 'Coupon is invalid');
    } catch (err) { next(err); }
  };

  applyCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.couponService.applyCoupon(req.body.code, req.params.bookingId, req.user.userId);
      successResponse(res, 200, result, 'Coupon applied successfully');
    } catch (err) { next(err); }
  };

  removeCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.couponService.removeCoupon(req.params.bookingId, req.user.userId);
      successResponse(res, 200, null, 'Coupon removed');
    } catch (err) { next(err); }
  };

  getAvailableCoupons = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const coupons = await this.couponService.getAvailableCoupons(
        req.query.listingId as string,
        req.query.listingType as string,
        req.query.vendorId as string,
        req.user.userId
      );
      successResponse(res, 200, coupons, 'Available coupons retrieved');
    } catch (err) { next(err); }
  };

  // ─── ADMIN ───

  createCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const coupon = await this.couponService.createCoupon(req.user.userId, req.body);
      successResponse(res, 201, coupon, 'Coupon created');
    } catch (err) { next(err); }
  };

  updateCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const coupon = await this.couponService.updateCoupon(req.params.id, req.body);
      successResponse(res, 200, coupon, 'Coupon updated');
    } catch (err) { next(err); }
  };

  deleteCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.couponService.deleteCoupon(req.params.id);
      successResponse(res, 200, null, 'Coupon deleted');
    } catch (err) { next(err); }
  };

  getCouponById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const coupon = await this.couponService.getCouponById(req.params.id);
      successResponse(res, 200, coupon, 'Coupon retrieved');
    } catch (err) { next(err); }
  };

  searchCoupons = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        type: req.query.type as string,
        vendorId: req.query.vendorId as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        discountType: req.query.discountType as string,
        search: req.query.search as string,
        startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
        startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.couponService.searchCoupons(filters);
      successResponse(res, 200, result.coupons, 'Coupons retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  getCouponStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.couponService.getCouponStats(req.params.id);
      successResponse(res, 200, stats, 'Coupon statistics');
    } catch (err) { next(err); }
  };

  bulkAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.couponService.bulkAction(req.body.couponIds, req.body.action);
      successResponse(res, 200, result, 'Bulk action completed');
    } catch (err) { next(err); }
  };
}
