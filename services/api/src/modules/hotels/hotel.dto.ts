import Joi from 'joi';

export const CreateHotelDto = Joi.object({
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
    taxRate: Joi.number().min(0).max(1).default(0.12),
    serviceFee: Joi.number().min(0).default(0),
    isNegotiable: Joi.boolean().default(false),
  }).required(),
  inventory: Joi.object({
    maxCapacity: Joi.number().integer().min(1).default(100),
    minGroupSize: Joi.number().integer().min(1).default(1),
    maxGroupSize: Joi.number().integer().min(1).default(100),
    bookingCutoffHours: Joi.number().integer().min(0).default(24),
  }).default(),
  inclusions: Joi.array().items(Joi.string().min(2).max(200)).min(1).max(50).required(),
  exclusions: Joi.array().items(Joi.string().min(2).max(200)).max(50).optional(),
  amenities: Joi.array().items(Joi.string().min(2).max(100)).max(50).optional(),
  tags: Joi.array().items(Joi.string().min(2).max(50)).max(30).optional(),
  languagesOffered: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10).default(['English']),
  cancellationPolicy: Joi.string().valid('flexible', 'moderate', 'strict', 'non_refundable').default('moderate'),
  propertyType: Joi.string().valid(
    'resort', 'hotel', 'homestay', 'hostel', 'villa', 'camp', 'boutique_hotel', 
    'heritage_property', 'guesthouse', 'farmhouse', 'treehouse', 'houseboat', 'cottage'
  ).required(),
  starRating: Joi.number().integer().min(1).max(5).optional(),
  checkInTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    'string.pattern.base': 'Check-in time must be in HH:MM format',
  }),
  checkOutTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    'string.pattern.base': 'Check-out time must be in HH:MM format',
  }),
  roomTypes: Joi.array().items(
    Joi.object({
      name: Joi.string().min(2).max(100).required().trim(),
      description: Joi.string().max(500).optional().trim().allow(''),
      maxOccupancy: Joi.number().integer().min(1).max(20).required(),
      bedConfiguration: Joi.string().max(100).required().trim(),
      sizeSqFt: Joi.number().min(50).optional(),
      amenities: Joi.array().items(Joi.string().min(2).max(100)).max(30).optional(),
      images: Joi.array().items(Joi.string().uri()).max(10).optional(),
      basePrice: Joi.number().min(0).required(),
      extraBedPrice: Joi.number().min(0).optional(),
      totalRooms: Joi.number().integer().min(1).max(1000).required(),
    })
  ).min(1).max(20).required(),
  isInstantBook: Joi.boolean().default(false),
  guideIds: Joi.array().items(Joi.string()).optional(),
});

export const UpdateHotelDto = Joi.object({
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
    taxRate: Joi.number().min(0).max(1),
    serviceFee: Joi.number().min(0),
    isNegotiable: Joi.boolean(),
  }),
  inventory: Joi.object({
    maxCapacity: Joi.number().integer().min(1),
    minGroupSize: Joi.number().integer().min(1),
    maxGroupSize: Joi.number().integer().min(1),
    bookingCutoffHours: Joi.number().integer().min(0),
  }),
  inclusions: Joi.array().items(Joi.string().min(2).max(200)).min(1).max(50),
  exclusions: Joi.array().items(Joi.string().min(2).max(200)).max(50),
  amenities: Joi.array().items(Joi.string().min(2).max(100)).max(50),
  tags: Joi.array().items(Joi.string().min(2).max(50)).max(30),
  languagesOffered: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10),
  cancellationPolicy: Joi.string().valid('flexible', 'moderate', 'strict', 'non_refundable'),
  propertyType: Joi.string().valid(
    'resort', 'hotel', 'homestay', 'hostel', 'villa', 'camp', 'boutique_hotel',
    'heritage_property', 'guesthouse', 'farmhouse', 'treehouse', 'houseboat', 'cottage'
  ),
  starRating: Joi.number().integer().min(1).max(5),
  checkInTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  checkOutTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  roomTypes: Joi.array().items(
    Joi.object({
      name: Joi.string().min(2).max(100).trim(),
      description: Joi.string().max(500).trim().allow(''),
      maxOccupancy: Joi.number().integer().min(1).max(20),
      bedConfiguration: Joi.string().max(100).trim(),
      sizeSqFt: Joi.number().min(50),
      amenities: Joi.array().items(Joi.string().min(2).max(100)).max(30),
      images: Joi.array().items(Joi.string().uri()).max(10),
      basePrice: Joi.number().min(0),
      extraBedPrice: Joi.number().min(0),
      totalRooms: Joi.number().integer().min(1).max(1000),
    })
  ).min(1).max(20),
  isInstantBook: Joi.boolean(),
  guideIds: Joi.array().items(Joi.string()),
  status: Joi.string().valid('draft', 'pending_review', 'published', 'archived', 'suspended'),
});

export const HotelSearchDto = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'price', 'rating', 'starRating', 'bookingCount', 'reviewCount').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  destinationId: Joi.string().optional(),
  destinationSlug: Joi.string().optional(),
  propertyType: Joi.string().optional(),
  starRating: Joi.number().integer().min(1).max(5).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isInstantBook: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
  checkIn: Joi.date().iso().optional(),
  checkOut: Joi.date().iso().optional(),
  guests: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().max(100).optional(),
  status: Joi.string().valid('published', 'draft', 'pending_review').optional(),
  vendorId: Joi.string().optional(),
});

export const UpdateHotelStatusDto = Joi.object({
  status: Joi.string().valid('draft', 'pending_review', 'published', 'archived', 'suspended').required(),
  reason: Joi.string().max(500).optional().trim().allow(''),
});

export const UpdateRoomAvailabilityDto = Joi.object({
  roomTypeId: Joi.string().required(),
  availability: Joi.array().items(
    Joi.object({
      date: Joi.date().iso().required(),
      availableRooms: Joi.number().integer().min(0).required(),
      priceOverride: Joi.number().min(0).optional(),
      isBlackout: Joi.boolean().default(false),
    })
  ).min(1).max(365).required(),
});

export const CalculateHotelPriceDto = Joi.object({
  roomTypeId: Joi.string().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().required().greater(Joi.ref('checkIn')).messages({
    'date.greater': 'Check-out must be after check-in',
  }),
  adults: Joi.number().integer().min(1).max(20).required(),
  children: Joi.number().integer().min(0).max(10).default(0),
  extraBeds: Joi.number().integer().min(0).max(5).default(0),
  couponCode: Joi.string().uppercase().optional(),
});
