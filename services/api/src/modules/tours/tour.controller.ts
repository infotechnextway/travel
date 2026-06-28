import { Request, Response, NextFunction } from 'express';
import { TourService } from './tour.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class TourController {
  constructor(private tourService: TourService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tour = await this.tourService.create(req.user!.userId, req.body);
      successResponse(res, tour, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tour = await this.tourService.getById(req.params.id);
      successResponse(res, tour);
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tour = await this.tourService.getBySlug(req.params.slug);
      successResponse(res, tour);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tour = await this.tourService.update(req.user!.userId, req.params.id, req.body);
      successResponse(res, tour);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.tourService.delete(req.user!.userId, req.params.id);
      successResponse(res, { message: 'Tour archived successfully' });
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.tourService.search(req.query as any);
      successResponse(res, result.tours, {
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
      const tour = await this.tourService.updateAvailability(req.user!.userId, req.params.id, req.body.availableDates);
      successResponse(res, tour);
    } catch (error) {
      next(error);
    }
  };

  calculatePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const price = await this.tourService.calculatePrice(req.params.id, req.body);
      successResponse(res, price);
    } catch (error) {
      next(error);
    }
  };

  getVendorTours = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.tourService.getVendorTours(req.user!.userId, req.query as any);
      successResponse(res, result.tours, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getSimilarTours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tours = await this.tourService.getSimilarTours(req.params.id, parseInt(req.query.limit as string) || 5);
      successResponse(res, tours);
    } catch (error) {
      next(error);
    }
  };

  submitForReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tour = await this.tourService.submitForReview(req.user!.userId, req.params.id);
      successResponse(res, tour);
    } catch (error) {
      next(error);
    }
  };
}
