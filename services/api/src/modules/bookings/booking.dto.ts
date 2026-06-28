import Joi from 'joi';
import { BookingStatus, PaymentStatus } from '@shared/enums';

export const CreateBookingDraftDto = Joi.object({
  listingId: Joi.string().uuid().required(),
  travelDates: Joi.object({
    startDate: Joi.date().iso().greater('now').required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
  }).required(),
  travelers: Joi.object({
    adults: Joi.number().integer().min(1).max(50).required(),
    children: Joi.number().integer().min(0).max(50).default(0),
    infants: Joi.number().integer().min(0).max(20).default(0)
  }).required(),
  specialRequests: Joi.string().trim().max(1000).allow('').optional()
});

export const UpdateBookingDraftDto = Joi.object({
  travelDates: Joi.object({
    startDate: Joi.date().iso().greater('now').required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
  }).optional(),
  specialRequests: Joi.string().trim().max(1000).allow('').optional()
}).min(1);

export const AddTravelerDto = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().trim().optional(),
  dateOfBirth: Joi.date().iso().less('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  passportNumber: Joi.string().trim().uppercase().optional(),
  aadhaarNumber: Joi.string().pattern(/^\d{12}$/).optional(),
  dietaryRestrictions: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
  specialNeeds: Joi.string().trim().max(500).optional(),
  isPrimary: Joi.boolean().default(false)
});

export const UpdateTravelerDto = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().trim().optional(),
  dateOfBirth: Joi.date().iso().less('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  passportNumber: Joi.string().trim().uppercase().optional(),
  aadhaarNumber: Joi.string().pattern(/^\d{12}$/).optional(),
  dietaryRestrictions: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
  specialNeeds: Joi.string().trim().max(500).optional()
}).min(1);

export const ApplyCouponDto = Joi.object({
  code: Joi.string().trim().min(3).max(50).required()
});

export const ConfirmBookingDto = Joi.object({
  paymentMethod: Joi.string().valid('card', 'upi', 'netbanking', 'wallet', 'emi').required(),
  useWalletBalance: Joi.boolean().default(false)
});

export const CancelBookingDto = Joi.object({
  reason: Joi.string().trim().min(10).max(500).required(),
  refundToWallet: Joi.boolean().default(true)
});

export const RescheduleBookingDto = Joi.object({
  newStartDate: Joi.date().iso().greater('now').required(),
  newEndDate: Joi.date().iso().greater(Joi.ref('newStartDate')).required(),
  reason: Joi.string().trim().min(10).max(500).required()
});

export const BookingSearchDto = Joi.object({
  status: Joi.string().valid(...Object.values(BookingStatus)).optional(),
  listingType: Joi.string().valid('tour', 'activity', 'hotel', 'transport').optional(),
  startDateFrom: Joi.date().iso().optional(),
  startDateTo: Joi.date().iso().optional(),
  search: Joi.string().trim().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'travelDates.startDate', 'finalAmount').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

export const AdminBookingSearchDto = Joi.object({
  status: Joi.string().valid(...Object.values(BookingStatus)).optional(),
  paymentStatus: Joi.string().valid(...Object.values(PaymentStatus)).optional(),
  refundStatus: Joi.string().valid('none', 'requested', 'approved', 'processed', 'rejected').optional(),
  listingType: Joi.string().optional(),
  customerId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().optional(),
  startDateFrom: Joi.date().iso().optional(),
  startDateTo: Joi.date().iso().optional(),
  search: Joi.string().trim().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'travelDates.startDate', 'finalAmount').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

export const AdminUpdateBookingDto = Joi.object({
  status: Joi.string().valid(...Object.values(BookingStatus)).optional(),
  guideId: Joi.string().uuid().optional(),
  adminNotes: Joi.string().trim().max(2000).optional(),
  refundAmount: Joi.number().min(0).optional(),
  refundStatus: Joi.string().valid('approved', 'rejected', 'processed').optional()
}).min(1);

export const ProcessRefundDto = Joi.object({
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('original', 'wallet').required(),
  reason: Joi.string().trim().min(10).max(500).required()
});

export const BulkBookingActionDto = Joi.object({
  bookingIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  action: Joi.string().valid('cancel', 'mark_complete', 'approve_refund').required(),
  reason: Joi.string().trim().min(10).max(500).required()
});
