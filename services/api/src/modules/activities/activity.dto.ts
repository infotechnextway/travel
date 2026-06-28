import Joi from 'joi';

export const CreateActivityDto = Joi.object({
  title: Joi.string().min(5).max(150).required().trim(),
  description: Joi.string().min(100).max(10000).required().trim(),
  shortDescription: Joi.string().max(300).optional().trim().allow(''),
  destinationId: Joi.string().required(),
  images: Joi.array().items(Joi.string().uri()).min(1).max(20).required(),
  videos: Joi.array().items(Joi.string().uri()).max(5).optional(),
  coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
    'array.length': 'Coordinates must be [longitude, latitude]',
  }),
  pricing: Joi.object({
    basePrice: Joi.number().min(0).required(),
    currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').default('INR'),
    pricePerPerson: Joi.number().min(0).required(),
    childPrice: Joi.number().min(0).optional(),
    infantPrice: Joi.number().min(0).optional(),
    groupSlabs: Joi.array().items(
      Joi.object({
        minPax: Joi.number().integer().min(1).required(),
        maxPax: Joi.number().integer().min(1).required(),
        pricePerPerson: Joi.number().min(0).required(),
      }).custom((value, helpers) => {
        if (value.minPax > value.maxPax) {
          return helpers.error('custom.minMaxPax', { message: 'minPax must be less than or equal to maxPax' });
        }
        return value;
      })
    ).optional(),
    taxRate: Joi.number().min(0).max(1).default(0.18),
    serviceFee: Joi.number().min(0).default(0),
    isNegotiable: Joi.boolean().default(false),
  }).required(),
  inventory: Joi.object({
    maxCapacity: Joi.number().integer().min(1).default(30),
    minGroupSize: Joi.number().integer().min(1).default(1),
    maxGroupSize: Joi.number().integer().min(1).default(30),
    availableDates: Joi.array().items(
      Joi.object({
        date: Joi.date().iso().required(),
        slots: Joi.number().integer().min(0).required(),
        priceOverride: Joi.number().min(0).optional(),
        isBlackout: Joi.boolean().default(false),
      })
    ).optional(),
    bookingCutoffHours: Joi.number().integer().min(0).default(12),
  }).default(),
  inclusions: Joi.array().items(Joi.string().min(2).max(200)).min(1).max(50).required(),
  exclusions: Joi.array().items(Joi.string().min(2).max(200)).max(50).optional(),
  amenities: Joi.array().items(Joi.string().min(2).max(100)).max(50).optional(),
  tags: Joi.array().items(Joi.string().min(2).max(50)).max(30).optional(),
  languagesOffered: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10).default(['English']),
  cancellationPolicy: Joi.string().valid('flexible', 'moderate', 'strict', 'non_refundable').default('moderate'),
  activityCategory: Joi.string().valid(
    'water_sports', 'air_sports', 'land_sports', 'snow_sports', 'adventure_racing',
    'camping', 'trekking', 'cycling', 'motor_sports', 'wildlife', 'cultural',
    'wellness', 'photography', 'cooking', 'nightlife', 'team_building'
  ).required(),
  difficulty: Joi.string().valid('easy', 'moderate', 'hard', 'extreme').default('moderate'),
  safetyBriefing: Joi.string().min(50).max(5000).required().trim(),
  equipmentProvided: Joi.array().items(Joi.string().min(2).max(200)).max(50).optional(),
  equipmentRequired: Joi.array().items(Joi.string().min(2).max(200)).max(50).optional(),
  weatherDependency: Joi.boolean().default(false),
  durationHours: Joi.number().integer().min(1).max(24).required(),
  minAge: Joi.number().integer().min(0).max(100).optional(),
  maxAge: Joi.number().integer().min(0).max(100).optional(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().messages({
    'string.pattern.base': 'Start time must be in HH:MM format',
  }),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().messages({
    'string.pattern.base': 'End time must be in HH:MM format',
  }),
  meetingPoint: Joi.string().max(500).optional().trim().allow(''),
  dropOffPoint: Joi.string().max(500).optional().trim().allow(''),
  isInstantBook: Joi.boolean().default(false),
  guideIds: Joi.array().items(Joi.string()).optional(),
});

export const UpdateActivityDto = Joi.object({
  title: Joi.string().min(5).max(150).trim(),
  description: Joi.string().min(100).max(10000).trim(),
  shortDescription: Joi.string().max(300).trim().allow(''),
  images: Joi.array().items(Joi.string().uri()).min(1).max(20),
  videos: Joi.array().items(Joi.string().uri()).max(5),
  coordinates: Joi.array().items(Joi.number()).length(2).messages({
    'array.length': 'Coordinates must be [longitude, latitude]',
  }),
  pricing: Joi.object({
    basePrice: Joi.number().min(0),
    currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP'),
    pricePerPerson: Joi.number().min(0),
    childPrice: Joi.number().min(0),
    infantPrice: Joi.number().min(0),
    groupSlabs: Joi.array().items(
      Joi.object({
        minPax: Joi.number().integer().min(1).required(),
        maxPax: Joi.number().integer().min(1).required(),
        pricePerPerson: Joi.number().min(0).required(),
      }).custom((value, helpers) => {
        if (value.minPax > value.maxPax) {
          return helpers.error('custom.minMaxPax', { message: 'minPax must be less than or equal to maxPax' });
        }
        return value;
      })
    ),
    taxRate: Joi.number().min(0).max(1),
    serviceFee: Joi.number().min(0),
    isNegotiable: Joi.boolean(),
  }),
  inventory: Joi.object({
    maxCapacity: Joi.number().integer().min(1),
    minGroupSize: Joi.number().integer().min(1),
    maxGroupSize: Joi.number().integer().min(1),
    availableDates: Joi.array().items(
      Joi.object({
        date: Joi.date().iso().required(),
        slots: Joi.number().integer().min(0).required(),
        priceOverride: Joi.number().min(0).optional(),
        isBlackout: Joi.boolean().default(false),
      })
    ),
    bookingCutoffHours: Joi.number().integer().min(0),
  }),
  inclusions: Joi.array().items(Joi.string().min(2).max(200)).min(1).max(50),
  exclusions: Joi.array().items(Joi.string().min(2).max(200)).max(50),
  amenities: Joi.array().items(Joi.string().min(2).max(100)).max(50),
  tags: Joi.array().items(Joi.string().min(2).max(50)).max(30),
  languagesOffered: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10),
  cancellationPolicy: Joi.string().valid('flexible', 'moderate', 'strict', 'non_refundable'),
  activityCategory: Joi.string().valid(
    'water_sports', 'air_sports', 'land_sports', 'snow_sports', 'adventure_racing',
    'camping', 'trekking', 'cycling', 'motor_sports', 'wildlife', 'cultural',
    'wellness', 'photography', 'cooking', 'nightlife', 'team_building'
  ),
  difficulty: Joi.string().valid('easy', 'moderate', 'hard', 'extreme'),
  safetyBriefing: Joi.string().min(50).max(5000).trim(),
  equipmentProvided: Joi.array().items(Joi.string().min(2).max(200)).max(50),
  equipmentRequired: Joi.array().items(Joi.string().min(2).max(200)).max(50),
  weatherDependency: Joi.boolean(),
  durationHours: Joi.number().integer().min(1).max(24),
  minAge: Joi.number().integer().min(0).max(100),
  maxAge: Joi.number().integer().min(0).max(100),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  meetingPoint: Joi.string().max(500).trim().allow(''),
  dropOffPoint: Joi.string().max(500).trim().allow(''),
  isInstantBook: Joi.boolean(),
  guideIds: Joi.array().items(Joi.string()),
  status: Joi.string().valid('draft', 'pending_review', 'published', 'archived', 'suspended'),
});

export const ActivitySearchDto = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'price', 'rating', 'durationHours', 'bookingCount', 'reviewCount').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  destinationId: Joi.string().optional(),
  destinationSlug: Joi.string().optional(),
  activityCategory: Joi.string().valid(
    'water_sports', 'air_sports', 'land_sports', 'snow_sports', 'adventure_racing',
    'camping', 'trekking', 'cycling', 'motor_sports', 'wildlife', 'cultural',
    'wellness', 'photography', 'cooking', 'nightlife', 'team_building'
  ).optional(),
  difficulty: Joi.string().valid('easy', 'moderate', 'hard', 'extreme').optional(),
  minDuration: Joi.number().integer().min(1).max(24).optional(),
  maxDuration: Joi.number().integer().min(1).max(24).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minAge: Joi.number().integer().min(0).optional(),
  maxAge: Joi.number().integer().min(0).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  isInstantBook: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
  weatherDependency: Joi.boolean().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  search: Joi.string().trim().max(100).optional(),
  status: Joi.string().valid('published', 'draft', 'pending_review').optional(),
  vendorId: Joi.string().optional(),
});

export const UpdateActivityStatusDto = Joi.object({
  status: Joi.string().valid('draft', 'pending_review', 'published', 'archived', 'suspended').required(),
  reason: Joi.string().max(500).optional().trim().allow(''),
});

export const UpdateActivityAvailabilityDto = Joi.object({
  availableDates: Joi.array().items(
    Joi.object({
      date: Joi.date().iso().required(),
      slots: Joi.number().integer().min(0).required(),
      priceOverride: Joi.number().min(0).optional(),
      isBlackout: Joi.boolean().default(false),
    })
  ).min(1).max(365).required(),
});

export const CalculateActivityPriceDto = Joi.object({
  travelers: Joi.number().integer().min(1).max(100).required(),
  children: Joi.number().integer().min(0).max(50).default(0),
  infants: Joi.number().integer().min(0).max(50).default(0),
  date: Joi.date().iso().optional(),
  couponCode: Joi.string().uppercase().optional(),
});
