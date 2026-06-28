import Joi from 'joi';

export const AdminUpdateUserDto = Joi.object({
  role: Joi.string().valid('customer', 'vendor', 'guide', 'admin', 'super_admin').optional(),
  isActive: Joi.boolean().optional(),
  kycStatus: Joi.string().valid('pending', 'verified', 'rejected').optional(),
  isVerified: Joi.boolean().optional(),
  notes: Joi.string().max(1000).optional().allow(''),
});

export const UserSearchDto = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'updatedAt', 'lastLoginAt', 'profile.firstName').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  role: Joi.string().valid('customer', 'vendor', 'guide', 'admin', 'super_admin').optional(),
  isActive: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
  kycStatus: Joi.string().valid('pending', 'verified', 'rejected').optional(),
  search: Joi.string().max(100).optional().allow(''),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  hasKycPending: Joi.boolean().optional(),
});

export const KycReviewDto = Joi.object({
  status: Joi.string().valid('verified', 'rejected').required(),
  documentIds: Joi.array().items(Joi.string()).optional(),
  rejectionReason: Joi.string().max(500).optional().allow(''),
  notes: Joi.string().max(1000).optional().allow(''),
});

export const BulkActionDto = Joi.object({
  userIds: Joi.array().items(Joi.string().required()).min(1).max(100).required(),
  action: Joi.string().valid('activate', 'deactivate', 'verify_kyc', 'reject_kyc').required(),
  reason: Joi.string().max(500).optional().allow(''),
});
