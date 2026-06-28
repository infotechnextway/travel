import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class ActivityController {
  constructor(private activityService: ActivityService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await this.activityService.create(req.user!.userId, req.body);
      successResponse(res, activity, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await this.activityService.getById(req.params.id);
      successResponse(res, activity);
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await this.activityService.getBySlug(req.params.slug);
      successResponse(res, activity);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await this.activityService.update(req.user!.userId, req.params.id, req.body);
      successResponse(res, activity);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.activityService.delete(req.user!.userId, req.params.id);
      successResponse(res, { message: 'Activity archived successfully' });
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.activityService.search(req.query as any);
      successResponse(res, result.activities, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  updateAvailability = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await this.activityService.updateAvailability(req.user!.userId, req.params.id, req.body.availableDates);
      successResponse(res, activity);
    } catch (error) {
      next(error);
    }
  };

  calculatePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const price = await this.activityService.calculatePrice(req.params.id, req.body);
      successResponse(res, price);
    } catch (error) {
      next(error);
    }
  };

  getVendorActivities = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.activityService.getVendorActivities(req.user!.userId, req.query as any);
      successResponse(res, result.activities, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getSimilarActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activities = await this.activityService.getSimilarActivities(req.params.id, parseInt(req.query.limit as string) || 5);
      successResponse(res, activities);
    } catch (error) {
      next(error);
    }
  };

  submitForReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activity = await this.activityService.submitForReview(req.user!.userId, req.params.id);
      successResponse(res, activity);
    } catch (error) {
      next(error);
    }
  };

  checkWeather = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.activityService.checkWeatherSuitability(req.params.id, req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };
}
