import Joi from 'joi';

export const OnboardingDto = Joi.object({
  businessName: Joi.string().min(2).max(100).required().trim(),
  businessType: Joi.string().valid(
    'tour_operator', 'hotel', 'resort', 'homestay', 'activity_provider', 'transport_operator', 'travel_agency'
  ).required(),
  description: Joi.string().max(2000).optional().trim(),
  gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().messages({
    'string.pattern.base': 'Invalid GSTIN format',
  }),
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required().messages({
    'string.pattern.base': 'Invalid PAN format',
  }),
  registrationNumber: Joi.string().max(50).optional().trim(),
  contactEmail: Joi.string().email().required().lowercase().trim(),
  contactPhone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Invalid phone number',
  }),
  website: Joi.string().uri().optional(),
  address: Joi.object({
    line1: Joi.string().required().trim(),
    line2: Joi.string().optional().trim().allow(''),
    city: Joi.string().required().trim(),
    state: Joi.string().required().trim(),
    postalCode: Joi.string().required().trim(),
  }).required(),
});

export const UpdateProfileDto = Joi.object({
  businessName: Joi.string().min(2).max(100).trim(),
  description: Joi.string().max(2000).trim().allow(''),
  contactEmail: Joi.string().email().lowercase().trim(),
  contactPhone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).messages({
    'string.pattern.base': 'Invalid phone number',
  }),
  website: Joi.string().uri().optional().allow(''),
  logo: Joi.string().uri().optional(),
  coverImage: Joi.string().uri().optional(),
  socialLinks: Joi.object().pattern(Joi.string(), Joi.string().uri()).optional(),
});

export const BankDetailsDto = Joi.object({
  accountHolderName: Joi.string().required().trim().max(100),
  accountNumber: Joi.string().required().trim().max(30),
  ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
    'string.pattern.base': 'Invalid IFSC code',
  }),
  bankName: Joi.string().required().trim().max(100),
  branchName: Joi.string().optional().trim().max(100),
  accountType: Joi.string().valid('savings', 'current').required(),
});

export const PayoutScheduleDto = Joi.object({
  payoutSchedule: Joi.string().valid('weekly', 'biweekly', 'monthly').required(),
});

export const VendorSearchDto = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'rating', 'totalBookings', 'totalRevenue').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  verificationStatus: Joi.string().valid('draft', 'submitted', 'under_review', 'verified', 'rejected', 'suspended').optional(),
  businessType: Joi.string().optional(),
  search: Joi.string().trim().max(100).optional(),
  isActive: Joi.boolean().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
});

export const DocumentUploadDto = Joi.object({
  type: Joi.string().valid('gst_certificate', 'pan_card', 'business_license', 'address_proof', 'bank_statement').required(),
  url: Joi.string().uri().required(),
});
