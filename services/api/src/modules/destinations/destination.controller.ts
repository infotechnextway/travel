import { Request, Response, NextFunction } from 'express';
import { DestinationService } from './destination.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class DestinationController {
  constructor(private destinationService: DestinationService) {}

  // Public endpoints
  getAllDestinations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.destinationService.searchDestinations({
        type: req.query.type as string,
        parentId: req.query.parentId as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        isFeatured: req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined,
        search: req.query.search as string,
        coordinates: req.query.lat && req.query.lng ? {
          lat: parseFloat(req.query.lat as string),
          lng: parseFloat(req.query.lng as string),
          radiusKm: parseFloat(req.query.radius as string) || 50,
        } : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: (req.query.sort as string) || 'name',
        order: (req.query.order as 'asc' | 'desc') || 'asc',
      });
      successResponse(res, result.destinations, {
        page: result.page,
        limit: result.destinations.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getDestinationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = await this.destinationService.getDestinationById(req.params.id);
      successResponse(res, destination);
    } catch (error) {
      next(error);
    }
  };

  getDestinationBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = await this.destinationService.getDestinationBySlug(req.params.slug);
      successResponse(res, destination);
    } catch (error) {
      next(error);
    }
  };

  getFeaturedDestinations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destinations = await this.destinationService.getFeaturedDestinations(
        parseInt(req.query.limit as string) || 10
      );
      successResponse(res, destinations);
    } catch (error) {
      next(error);
    }
  };

  getNearbyDestinations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destinations = await this.destinationService.getNearbyDestinations(
        parseFloat(req.query.lat as string),
        parseFloat(req.query.lng as string),
        parseFloat(req.query.radius as string) || 50,
        parseInt(req.query.limit as string) || 20
      );
      successResponse(res, destinations);
    } catch (error) {
      next(error);
    }
  };

  getHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hierarchy = await this.destinationService.getHierarchy(req.query.rootId as string);
      successResponse(res, hierarchy);
    } catch (error) {
      next(error);
    }
  };

  getChildren = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const children = await this.destinationService.getChildren(
        req.params.id,
        req.query.type as string
      );
      successResponse(res, children);
    } catch (error) {
      next(error);
    }
  };

  getBreadcrumb = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const breadcrumb = await this.destinationService.getBreadcrumb(req.params.id);
      successResponse(res, breadcrumb);
    } catch (error) {
      next(error);
    }
  };

  getMapData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mapData = await this.destinationService.getMapData(
        req.query.type as string,
        req.query.tags ? (req.query.tags as string).split(',') : undefined,
        req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined
      );
      successResponse(res, mapData);
    } catch (error) {
      next(error);
    }
  };

  getStateMapData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mapData = await this.destinationService.getStateMapData(req.params.slug);
      successResponse(res, mapData);
    } catch (error) {
      next(error);
    }
  };

  getWeatherInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const weather = await this.destinationService.getWeatherInfo(req.params.id);
      successResponse(res, weather);
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoints
  createDestination = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = await this.destinationService.createDestination(req.body);
      successResponse(res, destination, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  updateDestination = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = await this.destinationService.updateDestination(req.params.id, req.body);
      successResponse(res, destination);
    } catch (error) {
      next(error);
    }
  };

  deleteDestination = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.destinationService.deleteDestination(req.params.id);
      successResponse(res, { message: 'Destination deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateContent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = await this.destinationService.updateContent(req.params.id, req.body);
      successResponse(res, destination);
    } catch (error) {
      next(error);
    }
  };

  updateWeather = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = await this.destinationService.updateWeather(req.params.id, req.body);
      successResponse(res, destination);
    } catch (error) {
      next(error);
    }
  };

  bulkAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.destinationService.bulkAction(req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  getDestinationStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.destinationService.getDestinationStats();
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
