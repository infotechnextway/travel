import { Request, Response, NextFunction } from 'express';
import { ListingService } from './listing.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class ListingController {
  constructor(private listingService: ListingService) {}

  // Public endpoints
  searchListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listingService.searchListings({
        listingType: req.query.listingType as string,
        destinationId: req.query.destinationId as string,
        vendorId: req.query.vendorId as string,
        status: req.query.status as string,
        isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
        isInstantBook: req.query.isInstantBook !== undefined ? req.query.isInstantBook === 'true' : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
        languages: req.query.languages ? (req.query.languages as string).split(',') : undefined,
        difficulty: req.query.difficulty as string,
        durationDays: req.query.durationDays ? parseInt(req.query.durationDays as string) : undefined,
        durationHours: req.query.durationHours ? parseInt(req.query.durationHours as string) : undefined,
        activityCategory: req.query.activityCategory as string,
        propertyType: req.query.propertyType as string,
        transportType: req.query.transportType as string,
        search: req.query.search as string,
        coordinates: req.query.lat && req.query.lng ? {
          lat: parseFloat(req.query.lat as string),
          lng: parseFloat(req.query.lng as string),
          radiusKm: parseFloat(req.query.radius as string) || 50,
        } : undefined,
        availableDate: req.query.availableDate ? new Date(req.query.availableDate as string) : undefined,
        travelers: req.query.travelers ? parseInt(req.query.travelers as string) : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: (req.query.sort as string) || 'rating',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
      });
      successResponse(res, result.listings, {
        page: result.page,
        limit: result.listings.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getListingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.getListingById(req.params.id);
      successResponse(res, listing);
    } catch (error) {
      next(error);
    }
  };

  getListingBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.getListingBySlug(req.params.slug);
      successResponse(res, listing);
    } catch (error) {
      next(error);
    }
  };

  checkAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listingService.checkAvailability(
        req.params.id,
        new Date(req.body.date),
        parseInt(req.body.travelers)
      );
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  getFeaturedListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listings = await this.listingService.getFeaturedListings(
        req.query.listingType as string,
        parseInt(req.query.limit as string) || 10
      );
      successResponse(res, listings);
    } catch (error) {
      next(error);
    }
  };

  getRelatedListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listings = await this.listingService.getRelatedListings(
        req.params.id,
        parseInt(req.query.limit as string) || 6
      );
      successResponse(res, listings);
    } catch (error) {
      next(error);
    }
  };

  // Vendor endpoints
  createListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.createListing(req.user!.userId, req.body);
      successResponse(res, listing, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  updateListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.updateListing(req.user!.userId, req.params.id, req.body);
      successResponse(res, listing);
    } catch (error) {
      next(error);
    }
  };

  deleteListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.listingService.deleteListing(req.user!.userId, req.params.id);
      successResponse(res, { message: 'Listing archived successfully' });
    } catch (error) {
      next(error);
    }
  };

  getVendorListings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listings = await this.listingService.getVendorListings(req.user!.userId, {
        status: req.query.status as string,
        listingType: req.query.listingType as string,
      });
      successResponse(res, listings);
    } catch (error) {
      next(error);
    }
  };

  updateItinerary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.updateItinerary(req.user!.userId, req.params.id, req.body.itinerary);
      successResponse(res, listing);
    } catch (error) {
      next(error);
    }
  };

  updateCalendar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.updateCalendar(req.user!.userId, req.params.id, req.body.availableDates);
      successResponse(res, listing);
    } catch (error) {
      next(error);
    }
  };

  updatePricing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.updatePricing(req.user!.userId, req.params.id, req.body);
      successResponse(res, listing);
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoints
  listListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listingService.listListings({
        listingType: req.query.listingType as string,
        destinationId: req.query.destinationId as string,
        vendorId: req.query.vendorId as string,
        status: req.query.status as string,
        isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: (req.query.sort as string) || 'createdAt',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
      });
      successResponse(res, result.listings, {
        page: result.page,
        limit: result.listings.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getListingByIdAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.getListingByIdAdmin(req.params.id);
      successResponse(res, listing);
    } catch (error) {
      next(error);
    }
  };

  reviewListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.reviewListing(req.user!.userId, req.params.id, req.body);
      successResponse(res, listing);
    } catch (error) {
      next(error);
    }
  };

  bulkAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listingService.bulkAction(req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  getPendingReviewQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listingService.getPendingReviewQueue(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      successResponse(res, result.listings, {
        page: result.page,
        limit: result.listings.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getListingStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.listingService.getListingStats();
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
