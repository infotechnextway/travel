import { Router } from 'express';
import { BookingController } from './booking.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate, validateQuery } from '@shared/middleware/validation.middleware';
import {
  CreateBookingDraftDto, UpdateBookingDraftDto, AddTravelerDto, UpdateTravelerDto,
  ApplyCouponDto, ConfirmBookingDto, CancelBookingDto, RescheduleBookingDto,
  BookingSearchDto, AdminBookingSearchDto, AdminUpdateBookingDto,
  ProcessRefundDto, BulkBookingActionDto
} from './booking.dto';
import { Permission } from '@shared/enums';

export const createBookingRoutes = (controller: BookingController): Router => {
  const router = Router();

  // ─── CUSTOMER ROUTES ───
  router.post('/draft', authenticate, validate(CreateBookingDraftDto), controller.createDraft);
  router.patch('/draft/:id', authenticate, validate(UpdateBookingDraftDto), controller.updateDraft);
  router.post('/draft/:id/travelers', authenticate, validate(AddTravelerDto), controller.addTraveler);
  router.delete('/draft/:id/travelers/:travelerId', authenticate, controller.removeTraveler);
  router.post('/draft/:id/coupon', authenticate, validate(ApplyCouponDto), controller.applyCoupon);
  router.delete('/draft/:id/coupon', authenticate, controller.removeCoupon);
  router.post('/draft/:id/checkout', authenticate, controller.initiateCheckout);
  router.post('/:id/confirm', authenticate, validate(ConfirmBookingDto), controller.confirmBooking);
  router.post('/:id/cancel', authenticate, validate(CancelBookingDto), controller.cancelBooking);
  router.get('/my', authenticate, validateQuery(BookingSearchDto), controller.getMyBookings);
  router.get('/:id', authenticate, controller.getBookingDetails);

  // ─── VENDOR ROUTES ───
  router.get('/vendor/my', authenticate, authorize(Permission.VENDOR_CREATE_LISTING), validateQuery(BookingSearchDto), controller.getVendorBookings);
  router.post('/vendor/:id/confirm', authenticate, authorize(Permission.VENDOR_CREATE_LISTING), controller.confirmBookingVendor);
  router.post('/vendor/:id/complete', authenticate, authorize(Permission.VENDOR_CREATE_LISTING), controller.markComplete);
  router.post('/vendor/:id/reschedule', authenticate, authorize(Permission.VENDOR_CREATE_LISTING), validate(RescheduleBookingDto), controller.rescheduleBookingVendor);

  // ─── ADMIN ROUTES ───
  router.get('/admin/all', authenticate, authorize(Permission.MANAGE_BOOKINGS), validateQuery(AdminBookingSearchDto), controller.getAllBookings);
  router.post('/admin/:id/cancel', authenticate, authorize(Permission.MANAGE_BOOKINGS), controller.adminCancel);
  router.post('/admin/:id/reassign-guide', authenticate, authorize(Permission.MANAGE_BOOKINGS), controller.reassignGuide);
  router.post('/admin/:id/refund', authenticate, authorize(Permission.MANAGE_BOOKINGS), validate(ProcessRefundDto), controller.processRefund);
  router.get('/admin/stats', authenticate, authorize(Permission.MANAGE_BOOKINGS), controller.getBookingStats);
  router.get('/admin/revenue', authenticate, authorize(Permission.MANAGE_BOOKINGS), controller.getRevenueReport);
  router.post('/admin/bulk-action', authenticate, authorize(Permission.MANAGE_BOOKINGS), validate(BulkBookingActionDto), controller.bulkAction);

  return router;
};
