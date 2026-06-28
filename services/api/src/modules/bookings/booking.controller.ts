import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class BookingController {
  constructor(private bookingService: BookingService) {}

  // ─── CUSTOMER ───

  createDraft = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.createDraft(req.user.userId, req.body);
      successResponse(res, 201, booking, 'Booking draft created');
    } catch (err) { next(err); }
  };

  updateDraft = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.updateDraft(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, booking, 'Booking draft updated');
    } catch (err) { next(err); }
  };

  addTraveler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.addTraveler(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, booking, 'Traveler added');
    } catch (err) { next(err); }
  };

  removeTraveler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.removeTraveler(req.params.id, req.user.userId, req.params.travelerId);
      successResponse(res, 200, booking, 'Traveler removed');
    } catch (err) { next(err); }
  };

  applyCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.applyCoupon(req.params.id, req.user.userId, req.body.code);
      successResponse(res, 200, booking, 'Coupon applied');
    } catch (err) { next(err); }
  };

  removeCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.removeCoupon(req.params.id, req.user.userId);
      successResponse(res, 200, booking, 'Coupon removed');
    } catch (err) { next(err); }
  };

  initiateCheckout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.bookingService.initiateCheckout(req.params.id, req.user.userId);
      successResponse(res, 200, result, 'Checkout initiated. Complete payment within 15 minutes.');
    } catch (err) { next(err); }
  };

  confirmBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.confirmBooking(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, booking, 'Booking confirmed');
    } catch (err) { next(err); }
  };

  cancelBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.cancelBooking(req.params.id, req.user.userId, req.body.reason, req.body.refundToWallet);
      successResponse(res, 200, booking, 'Booking cancelled');
    } catch (err) { next(err); }
  };

  getMyBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status ? (req.query.status as string).split(',') as any[] : undefined,
        listingType: req.query.listingType as string,
        startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
        startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string,
        order: req.query.order as string
      };
      const result = await this.bookingService.getMyBookings(req.user.userId, filters);
      successResponse(res, 200, result.bookings, 'Bookings retrieved', { page: filters.page, limit: filters.limit, total: result.total }, result.stats);
    } catch (err) { next(err); }
  };

  getBookingDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.getBookingDetails(req.params.id, req.user.userId, req.user.role);
      successResponse(res, 200, booking, 'Booking details retrieved');
    } catch (err) { next(err); }
  };

  // ─── VENDOR ───

  getVendorBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status ? (req.query.status as string).split(',') as any[] : undefined,
        startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
        startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string,
        order: req.query.order as string
      };
      const result = await this.bookingService.getVendorBookings(req.user.userId, filters);
      successResponse(res, 200, result.bookings, 'Vendor bookings retrieved', { page: filters.page, limit: filters.limit, total: result.total }, result.stats);
    } catch (err) { next(err); }
  };

  confirmBookingVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.confirmBookingVendor(req.params.id, req.user.userId);
      successResponse(res, 200, booking, 'Booking confirmed by vendor');
    } catch (err) { next(err); }
  };

  markComplete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.markComplete(req.params.id, req.user.userId);
      successResponse(res, 200, booking, 'Booking marked as complete');
    } catch (err) { next(err); }
  };

  rescheduleBookingVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.rescheduleBookingVendor(req.params.id, req.user.userId, req.body.newDates, req.body.reason);
      successResponse(res, 200, booking, 'Booking rescheduled');
    } catch (err) { next(err); }
  };

  // ─── ADMIN ───

  getAllBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        refundStatus: req.query.refundStatus as any,
        listingType: req.query.listingType as string,
        customerId: req.query.customerId as string,
        vendorId: req.query.vendorId as string,
        startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
        startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string,
        order: req.query.order as string
      };
      const result = await this.bookingService.getAllBookings(filters);
      successResponse(res, 200, result.bookings, 'All bookings retrieved', { page: filters.page, limit: filters.limit, total: result.total });
    } catch (err) { next(err); }
  };

  adminCancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.adminCancel(req.params.id, req.user.userId, req.body.reason);
      successResponse(res, 200, booking, 'Booking cancelled by admin');
    } catch (err) { next(err); }
  };

  reassignGuide = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.reassignGuide(req.params.id, req.user.userId, req.body.guideId);
      successResponse(res, 200, booking, 'Guide reassigned');
    } catch (err) { next(err); }
  };

  processRefund = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.processRefund(req.params.id, req.user.userId, req.body);
      successResponse(res, 200, booking, 'Refund processed');
    } catch (err) { next(err); }
  };

  getBookingStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await this.bookingService.getBookingStats(startDate, endDate);
      successResponse(res, 200, stats, 'Booking statistics');
    } catch (err) { next(err); }
  };

  getRevenueReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const report = await this.bookingService.getRevenueReport(startDate, endDate);
      successResponse(res, 200, report, 'Revenue report');
    } catch (err) { next(err); }
  };

  bulkAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.bookingService.bulkAction(req.body.bookingIds, req.body.action, req.body.reason, req.user.userId);
      successResponse(res, 200, result, 'Bulk action completed');
    } catch (err) { next(err); }
  };
}
