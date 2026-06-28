import Joi from 'joi';

export const CreateCouponDto = Joi.object({
  code: Joi.string().trim().min(3).max(50).required(),
  type: Joi.string().valid('global', 'vendor').required(),
  vendorId: Joi.string().uuid().when('type', { is: 'vendor', then: Joi.required(), otherwise: Joi.optional() }),
  discountType: Joi.string().valid('percent', 'flat', 'cashback').required(),
  discountValue: Joi.number().min(0).required(),
  maxDiscount: Joi.number().min(0).optional(),
  minOrderValue: Joi.number().min(0).default(0),
  cashbackPercent: Joi.number().min(0).max(100).when('discountType', { is: 'cashback', then: Joi.required(), otherwise: Joi.optional() }),
  usageLimitTotal: Joi.number().integer().min(1).required(),
  usageLimitPerUser: Joi.number().integer().min(1).required(),
  applicableListingTypes: Joi.array().items(Joi.string().valid('tour', 'activity', 'hotel', 'transport')).default([]),
  applicableVendorIds: Joi.array().items(Joi.string().uuid()).optional(),
  applicableListingIds: Joi.array().items(Joi.string().uuid()).optional(),
  excludedListingIds: Joi.array().items(Joi.string().uuid()).optional(),
  firstTimeOnly: Joi.boolean().default(false),
  newUserOnly: Joi.boolean().default(false),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  description: Joi.string().trim().max(500).optional(),
  terms: Joi.string().trim().max(2000).optional()
});

export const UpdateCouponDto = Joi.object({
  discountValue: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).optional(),
  minOrderValue: Joi.number().min(0).optional(),
  usageLimitTotal: Joi.number().integer().min(1).optional(),
  usageLimitPerUser: Joi.number().integer().min(1).optional(),
  applicableListingTypes: Joi.array().items(Joi.string().valid('tour', 'activity', 'hotel', 'transport')).optional(),
  applicableVendorIds: Joi.array().items(Joi.string().uuid()).optional(),
  applicableListingIds: Joi.array().items(Joi.string().uuid()).optional(),
  excludedListingIds: Joi.array().items(Joi.string().uuid()).optional(),
  firstTimeOnly: Joi.boolean().optional(),
  newUserOnly: Joi.boolean().optional(),
  endDate: Joi.date().iso().optional(),
  isActive: Joi.boolean().optional(),
  description: Joi.string().trim().max(500).optional(),
  terms: Joi.string().trim().max(2000).optional()
}).min(1);

export const ValidateCouponDto = Joi.object({
  code: Joi.string().trim().required(),
  listingId: Joi.string().uuid().required(),
  listingType: Joi.string().valid('tour', 'activity', 'hotel', 'transport').required(),
  vendorId: Joi.string().uuid().required(),
  amount: Joi.number().min(0).required()
});

export const CouponSearchDto = Joi.object({
  type: Joi.string().valid('global', 'vendor').optional(),
  vendorId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  discountType: Joi.string().valid('percent', 'flat', 'cashback').optional(),
  search: Joi.string().trim().max(100).optional(),
  startDateFrom: Joi.date().iso().optional(),
  startDateTo: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const BulkCouponActionDto = Joi.object({
  couponIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  action: Joi.string().valid('activate', 'deactivate', 'delete').required()
});
