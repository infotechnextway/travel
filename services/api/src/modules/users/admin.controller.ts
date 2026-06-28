import { Request, Response, NextFunction } from 'express';
import { AdminUserService } from './admin.service';
import { successResponse } from '@shared/utils/response';

export class AdminUserController {
  constructor(private adminUserService: AdminUserService) {}

  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminUserService.searchUsers(req.query as any);
      successResponse(res, result.users, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.adminUserService.getUserById(req.params.id);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.adminUserService.updateUserStatus(
        req.params.id,
        req.body.isActive,
        req.body.reason
      );
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  verifyKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.adminUserService.verifyKyc(
        req.params.id,
        req.body.documentId,
        req.body.status,
        req.body.notes
      );
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  getKycQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminUserService.getKycQueue(req.query as any);
      successResponse(res, result.users, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  bulkAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminUserService.bulkAction(req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  getUserStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminUserService.getUserStats();
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
