import { Request, Response, NextFunction } from 'express';
import { GuideService } from './guide.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class GuideController {
  constructor(private guideService: GuideService) {}

  // Registration
  registerGuide = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.registerGuide(req.user!.userId, req.body);
      successResponse(res, guide, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  // Profile
  getGuideProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.getGuideProfile(req.user!.userId);
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  updateGuideProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.updateGuideProfile(req.user!.userId, req.body);
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  // Certifications
  addCertification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.addCertification(req.user!.userId, req.body);
      successResponse(res, guide, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  removeCertification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.removeCertification(req.user!.userId, req.params.id);
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  // Availability
  updateAvailability = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.updateAvailability(req.user!.userId, req.body);
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  getAvailability = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const availability = await this.guideService.getAvailability(req.user!.userId, startDate, endDate);
      successResponse(res, availability);
    } catch (error) {
      next(error);
    }
  };

  // Assignments
  getAssignments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.guideService.getAssignments(req.user!.userId, {
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      successResponse(res, result.assignments, {
        page: result.page,
        limit: result.assignments.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  respondToAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignment = await this.guideService.respondToAssignment(
        req.user!.userId,
        req.params.id,
        req.body
      );
      successResponse(res, assignment);
    } catch (error) {
      next(error);
    }
  };

  // Earnings
  getEarnings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const earnings = await this.guideService.getEarnings(req.user!.userId, { startDate, endDate });
      successResponse(res, earnings);
    } catch (error) {
      next(error);
    }
  };

  getEarningsSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.guideService.getEarningsSummary(req.user!.userId);
      successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  };

  // Ratings
  getRatingAggregation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ratings = await this.guideService.getRatingAggregation(req.user!.userId);
      successResponse(res, ratings);
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoints
  listGuides = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.guideService.listGuides({
        skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
        languages: req.query.languages ? (req.query.languages as string).split(',') : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        maxGroupSize: req.query.maxGroupSize ? parseInt(req.query.maxGroupSize as string) : undefined,
        isAvailable: req.query.isAvailable !== undefined ? req.query.isAvailable === 'true' : undefined,
        verificationStatus: req.query.verificationStatus as string,
        destination: req.query.destination as string,
        search: req.query.search as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: (req.query.sort as string) || 'rating',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
      });
      successResponse(res, result.guides, {
        page: result.page,
        limit: result.guides.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getGuideById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.getGuideById(req.params.id);
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  reviewGuide = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.reviewGuide(req.user!.userId, req.params.id, req.body);
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  suspendGuide = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.suspendGuide(req.user!.userId, req.params.id, req.body.reason);
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  activateGuide = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guide = await this.guideService.activateGuide(req.user!.userId, req.params.id);
      successResponse(res, guide);
    } catch (error) {
      next(error);
    }
  };

  bulkAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.guideService.bulkAction(req.user!.userId, req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  getPendingVerificationQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.guideService.getPendingVerificationQueue(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      successResponse(res, result.guides, {
        page: result.page,
        limit: result.guides.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getGuideStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.guideService.getGuideStats();
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };

  // Public discovery
  findAvailableGuides = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.guideService.findAvailableGuides({
        skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
        languages: req.query.languages ? (req.query.languages as string).split(',') : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        maxGroupSize: req.query.maxGroupSize ? parseInt(req.query.maxGroupSize as string) : undefined,
        destination: req.query.destination as string,
        date: req.query.date ? new Date(req.query.date as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      successResponse(res, result.guides, {
        page: result.page,
        limit: result.guides.length,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };
}
