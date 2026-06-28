import { Request, Response, NextFunction } from 'express';
import { RewardService } from './reward.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class RewardController {
  constructor(private rewardService: RewardService) {}

  // ─── CUSTOMER ───

  getMyPoints = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.rewardService.getUserPoints(req.user.userId);
      successResponse(res, 200, result, 'Points balance retrieved');
    } catch (err) { next(err); }
  };

  getMyTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.rewardService.getTransactions(req.user.userId, page, limit);
      successResponse(res, 200, result.transactions, 'Transactions retrieved', { page, limit, total: result.total });
    } catch (err) { next(err); }
  };

  burnPoints = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.rewardService.burnPoints(req.user.userId, req.body.points, req.body.bookingId);
      successResponse(res, 200, result, 'Points redeemed successfully');
    } catch (err) { next(err); }
  };

  // ─── ADMIN ───

  manualCredit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const transaction = await this.rewardService.manualCredit(req.body.userId, req.body.points, req.body.description, req.body.expiryDays);
      successResponse(res, 200, transaction, 'Points credited manually');
    } catch (err) { next(err); }
  };

  manualDebit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const transaction = await this.rewardService.manualDebit(req.body.userId, req.body.points, req.body.description);
      successResponse(res, 200, transaction, 'Points debited manually');
    } catch (err) { next(err); }
  };

  expireOldPoints = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.rewardService.expireOldPoints();
      successResponse(res, 200, result, 'Expired points processed');
    } catch (err) { next(err); }
  };

  getAllTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        userId: req.query.userId as string,
        type: req.query.type as string,
        source: req.query.source as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await this.rewardService.getAllTransactions(filters);
      successResponse(res, 200, result.transactions, 'All transactions retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  getTopEarners = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const result = await this.rewardService.getTopEarners(limit);
      successResponse(res, 200, result, 'Top earners retrieved');
    } catch (err) { next(err); }
  };
}
