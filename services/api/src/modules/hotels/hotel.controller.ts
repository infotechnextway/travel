import { Request, Response, NextFunction } from 'express';
import { HotelService } from './hotel.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class HotelController {
  constructor(private hotelService: HotelService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await this.hotelService.create(req.user!.userId, req.body);
      successResponse(res, hotel, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await this.hotelService.getById(req.params.id);
      successResponse(res, hotel);
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await this.hotelService.getBySlug(req.params.slug);
      successResponse(res, hotel);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await this.hotelService.update(req.user!.userId, req.params.id, req.body);
      successResponse(res, hotel);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.hotelService.delete(req.user!.userId, req.params.id);
      successResponse(res, { message: 'Hotel archived successfully' });
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.hotelService.search(req.query as any);
      successResponse(res, result.hotels, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  updateRoomAvailability = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await this.hotelService.updateRoomAvailability(
        req.user!.userId,
        req.params.id,
        req.body.roomTypeId,
        req.body.availability
      );
      successResponse(res, hotel);
    } catch (error) {
      next(error);
    }
  };

  calculatePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const price = await this.hotelService.calculatePrice(req.params.id, req.body);
      successResponse(res, price);
    } catch (error) {
      next(error);
    }
  };

  getVendorHotels = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.hotelService.getVendorHotels(req.user!.userId, req.query as any);
      successResponse(res, result.hotels, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getSimilarHotels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotels = await this.hotelService.getSimilarHotels(req.params.id, parseInt(req.query.limit as string) || 5);
      successResponse(res, hotels);
    } catch (error) {
      next(error);
    }
  };

  submitForReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hotel = await this.hotelService.submitForReview(req.user!.userId, req.params.id);
      successResponse(res, hotel);
    } catch (error) {
      next(error);
    }
  };
}
