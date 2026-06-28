import { Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class UserController {
  constructor(private userService: UserService) {}

  // Profile endpoints
  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getProfile(req.user!.userId);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.updateProfile(req.user!.userId, req.body);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  // Address endpoints
  addAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.addAddress(req.user!.userId, req.body);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  removeAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.removeAddress(req.user!.userId, req.params.id);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  // Family member endpoints
  addFamilyMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.addFamilyMember(req.user!.userId, req.body);
      successResponse(res, user, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  updateFamilyMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.updateFamilyMember(req.user!.userId, req.params.id, req.body);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  removeFamilyMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.removeFamilyMember(req.user!.userId, req.params.id);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  // KYC endpoints
  uploadKycDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.uploadKycDocument(req.user!.userId, req.body);
      successResponse(res, user, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  removeKycDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.removeKycDocument(req.user!.userId, req.params.id);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.uploadAvatar(req.user!.userId, req.body.fileUrl);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoints
  listUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.listUsers({
        role: req.query.role as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
        kycStatus: req.query.kycStatus as string,
        search: req.query.search as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        hasKycPending: req.query.hasKycPending !== undefined ? req.query.hasKycPending === 'true' : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: (req.query.sort as string) || 'createdAt',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
      });
      successResponse(res, result.users, {
        page: result.page,
        limit: result.users.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  adminUpdateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.adminUpdateUser(req.user!.userId, req.params.id, req.body);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  suspendUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.suspendUser(req.user!.userId, req.params.id, req.body.reason);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  activateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.activateUser(req.user!.userId, req.params.id);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  bulkAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.bulkAction(req.user!.userId, req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  getKycQueue = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.getKycQueue(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20,
        (req.query.status as string) || 'pending'
      );
      successResponse(res, result.users, {
        page: result.page,
        limit: result.users.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  reviewKyc = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.reviewKyc(req.user!.userId, req.params.id, req.body);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  getUserStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userService.getUserStats();
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
