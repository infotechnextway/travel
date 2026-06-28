import { Request, Response, NextFunction } from 'express';
import { GuideService } from './guide.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class GuideAdminController {
  constructor(private guideService: GuideService) {}

  searchGuides = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.guideService.searchGuides(req.query as any);
      successResponse(res, result.guides, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getGuideStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.guideService.getGuideStats();
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };

  updateVerificationStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.updateVerificationStatus(
        req.user!.userId,
        req.params.id,
        req.body.status,
        req.body.notes
      );
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  verifyCertification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.verifyCertification(
        req.user!.userId,
        req.params.id,
        req.body.certificationId,
        req.body.isVerified
      );
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };
}
