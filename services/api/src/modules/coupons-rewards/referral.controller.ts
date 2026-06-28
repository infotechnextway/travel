import { Request, Response, NextFunction } from 'express';
import { ReferralService } from './referral.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class ReferralController {
  constructor(private referralService: ReferralService) {}

  // ─── CUSTOMER ───

  getMyReferralCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.referralService.getMyReferralCode(req.user.userId, req.user.name || 'USER');
      successResponse(res, 200, result, 'Referral code retrieved');
    } catch (err) { next(err); }
  };

  getMyReferrals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.referralService.getMyReferrals(req.user.userId);
      successResponse(res, 200, result, 'Referrals retrieved');
    } catch (err) { next(err); }
  };

  applyReferralCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.referralService.applyReferralCode(req.user.userId, req.body.code);
      successResponse(res, 200, result, 'Referral code applied successfully');
    } catch (err) { next(err); }
  };

  // ─── ADMIN ───

  searchReferrals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        referrerId: req.query.referrerId as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.referralService.searchReferrals(filters);
      successResponse(res, 200, result.referrals, 'Referrals retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  updateBonusSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const referral = await this.referralService.updateBonusSettings(req.params.id, req.body);
      successResponse(res, 200, referral, 'Bonus settings updated');
    } catch (err) { next(err); }
  };

  getPlatformStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.referralService.getPlatformStats();
      successResponse(res, 200, stats, 'Platform referral statistics');
    } catch (err) { next(err); }
  };

  expirePending = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.referralService.expirePendingReferrals();
      successResponse(res, 200, result, 'Expired pending referrals');
    } catch (err) { next(err); }
  };
}
