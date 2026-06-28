import Joi from 'joi';

export const RegisterGuideDto = Joi.object({
  bio: Joi.string().min(50).max(2000).required().trim().messages({
    'string.min': 'Bio must be at least 50 characters',
    'string.max': 'Bio cannot exceed 2000 characters',
  }),
  languages: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10).required().messages({
    'array.min': 'At least one language is required',
    'array.max': 'Maximum 10 languages allowed',
  }),
  skills: Joi.array().items(
    Joi.string().valid(
      'trekking', 'mountaineering', 'rock_climbing', 'rafting', 'kayaking',
      'scuba_diving', 'snorkeling', 'paragliding', 'skiing', 'snowboarding',
      'wildlife_safari', 'bird_watching', 'photography', 'cycling', 'motorcycling',
      'camping', 'yoga', 'ayurveda', 'cooking', 'history', 'archaeology',
      'culture', 'spiritual', 'adventure', 'nature', 'first_aid', 'rescue'
    )
  ).min(1).max(20).required(),
  experienceYears: Joi.number().integer().min(0).max(50).default(0),
  maxGroupSize: Joi.number().integer().min(1).max(50).default(20),
  preferredDestinations: Joi.array().items(Joi.string().min(2).max(100)).max(20).default([]),
  emergencyContact: Joi.object({
    name: Joi.string().required().trim(),
    phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required(),
  }).required(),
});

export const UpdateGuideProfileDto = Joi.object({
  bio: Joi.string().min(50).max(2000).trim().optional(),
  languages: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10).optional(),
  skills: Joi.array().items(
    Joi.string().valid(
      'trekking', 'mountaineering', 'rock_climbing', 'rafting', 'kayaking',
      'scuba_diving', 'snorkeling', 'paragliding', 'skiing', 'snowboarding',
      'wildlife_safari', 'bird_watching', 'photography', 'cycling', 'motorcycling',
      'camping', 'yoga', 'ayurveda', 'cooking', 'history', 'archaeology',
      'culture', 'spiritual', 'adventure', 'nature', 'first_aid', 'rescue'
    )
  ).min(1).max(20).optional(),
  experienceYears: Joi.number().integer().min(0).max(50).optional(),
  maxGroupSize: Joi.number().integer().min(1).max(50).optional(),
  preferredDestinations: Joi.array().items(Joi.string().min(2).max(100)).max(20).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().trim().optional(),
    phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).optional(),
  }).optional(),
});

export const CertificationDto = Joi.object({
  name: Joi.string().min(2).max(200).required().trim(),
  issuedBy: Joi.string().min(2).max(200).required().trim(),
  issuedAt: Joi.date().iso().required().less('now'),
  expiresAt: Joi.date().iso().greater(Joi.ref('issuedAt')).optional(),
  documentUrl: Joi.string().uri().required(),
});

export const AvailabilityDto = Joi.object({
  availability: Joi.array().items(
    Joi.object({
      date: Joi.date().iso().required(),
      isAvailable: Joi.boolean().default(true),
      listingIds: Joi.array().items(Joi.string()).default([]),
    })
  ).min(1).max(365).required(),
});

export const UpdateAvailabilityDto = Joi.object({
  date: Joi.date().iso().required(),
  isAvailable: Joi.boolean().required(),
  listingIds: Joi.array().items(Joi.string()).default([]),
});

export const GuideSearchDto = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('rating', 'tripCount', 'experienceYears', 'createdAt', 'totalEarnings').default('rating'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  skills: Joi.string().optional(),
  languages: Joi.string().optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  maxGroupSize: Joi.number().integer().min(1).max(50).optional(),
  isAvailable: Joi.boolean().optional(),
  verificationStatus: Joi.string().valid('pending', 'submitted', 'under_review', 'verified', 'rejected').optional(),
  destination: Joi.string().optional(),
  search: Joi.string().max(100).optional().allow(''),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
});

export const ReviewGuideDto = Joi.object({
  status: Joi.string().valid('verified', 'rejected', 'under_review').required(),
  notes: Joi.string().max(2000).optional().allow(''),
  rejectionReason: Joi.string().max(1000).optional().allow(''),
});

export const BulkGuideActionDto = Joi.object({
  guideIds: Joi.array().items(Joi.string().required()).min(1).max(100).required(),
  action: Joi.string().valid('activate', 'deactivate', 'verify', 'suspend').required(),
  reason: Joi.string().max(500).optional().allow(''),
});

export const AssignmentDto = Joi.object({
  bookingId: Joi.string().required(),
  listingId: Joi.string().required(),
  autoAssign: Joi.boolean().default(false),
  guideId: Joi.string().optional(),
  notes: Joi.string().max(500).optional().allow(''),
});

export const AssignmentResponseDto = Joi.object({
  accept: Joi.boolean().required(),
  reason: Joi.string().max(500).optional().allow(''),
});
