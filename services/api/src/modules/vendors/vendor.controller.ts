import { Request, Response, NextFunction } from 'express';
import { VendorService } from './vendor.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class VendorController {
  constructor(private vendorService: VendorService) {}

  onboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.onboard(req.user!.userId, req.body);
      successResponse(res, vendor, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.getProfile(req.user!.userId);
      successResponse(res, vendor);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.updateProfile(req.user!.userId, req.body);
      successResponse(res, vendor);
    } catch (error) {
      next(error);
    }
  };

  updateBankDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.updateBankDetails(req.user!.userId, req.body);
      successResponse(res, vendor);
    } catch (error) {
      next(error);
    }
  };

  updatePayoutSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.updatePayoutSchedule(req.user!.userId, req.body.payoutSchedule);
      successResponse(res, vendor);
    } catch (error) {
      next(error);
    }
  };

  uploadDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.uploadDocument(req.user!.userId, req.body);
      successResponse(res, vendor);
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dashboard = await this.vendorService.getDashboard(req.user!.userId);
      successResponse(res, dashboard);
    } catch (error) {
      next(error);
    }
  };

  getPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.getProfileBySlug(req.params.slug);
      successResponse(res, vendor);
    } catch (error) {
      next(error);
    }
  };
}
