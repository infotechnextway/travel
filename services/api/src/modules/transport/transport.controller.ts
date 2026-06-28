import { Request, Response, NextFunction } from 'express';
import { TransportService } from './transport.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class TransportController {
  constructor(private transportService: TransportService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await this.transportService.create(req.user!.userId, req.body);
      successResponse(res, transport, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await this.transportService.getById(req.params.id);
      successResponse(res, transport);
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await this.transportService.getBySlug(req.params.slug);
      successResponse(res, transport);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await this.transportService.update(req.user!.userId, req.params.id, req.body);
      successResponse(res, transport);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.transportService.delete(req.user!.userId, req.params.id);
      successResponse(res, { message: 'Transport archived successfully' });
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.transportService.search(req.query as any);
      successResponse(res, result.transports, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  calculatePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const price = await this.transportService.calculatePrice(req.params.id, req.body);
      successResponse(res, price);
    } catch (error) {
      next(error);
    }
  };

  updateFleetStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await this.transportService.updateFleetStatus(
        req.user!.userId,
        req.params.id,
        req.body.fleetIndex,
        req.body.isActive,
        req.body.reason
      );
      successResponse(res, transport);
    } catch (error) {
      next(error);
    }
  };

  updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.transportService.updateLocation(req.params.id, {
        ...req.body,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      });
      successResponse(res, { message: 'Location updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  getLocationHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this.transportService.getLocationHistory(
        req.params.id,
        parseInt(req.query.limit as string) || 100
      );
      successResponse(res, history);
    } catch (error) {
      next(error);
    }
  };

  getVendorTransports = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.transportService.getVendorTransports(req.user!.userId, req.query as any);
      successResponse(res, result.transports, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getSimilarTransports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transports = await this.transportService.getSimilarTransports(req.params.id, parseInt(req.query.limit as string) || 5);
      successResponse(res, transports);
    } catch (error) {
      next(error);
    }
  };

  submitForReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transport = await this.transportService.submitForReview(req.user!.userId, req.params.id);
      successResponse(res, transport);
    } catch (error) {
      next(error);
    }
  };

  getFleetUtilization = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const utilization = await this.transportService.getFleetUtilization(req.user!.userId, req.params.id);
      successResponse(res, utilization);
    } catch (error) {
      next(error);
    }
  };
}
