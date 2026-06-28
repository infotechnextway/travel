import { Request, Response, NextFunction } from 'express';
import { DestinationService } from './destination.service';
import { successResponse } from '@shared/utils/response';

export class DestinationAdminController {
  constructor(private destinationService: DestinationService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = await this.destinationService.create(req.body);
      successResponse(res, destination, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = await this.destinationService.update(req.params.id, req.body);
      successResponse(res, destination);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.destinationService.delete(req.params.id);
      successResponse(res, { message: 'Destination deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.destinationService.getDestinationStats();
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };

  reorderFeatured = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destinations = await this.destinationService.reorderFeatured(req.body.destinationIds);
      successResponse(res, destinations);
    } catch (error) {
      next(error);
    }
  };
}
