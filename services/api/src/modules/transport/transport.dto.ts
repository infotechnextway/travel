import Joi from 'joi';

export const CreateTransportDto = Joi.object({
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
    taxRate: Joi.number().min(0).max(1).default(0.10),
    serviceFee: Joi.number().min(0).default(0),
    isNegotiable: Joi.boolean().default(false),
  }).required(),
  inventory: Joi.object({
    maxCapacity: Joi.number().integer().min(1).default(50),
    minGroupSize: Joi.number().integer().min(1).default(1),
    maxGroupSize: Joi.number().integer().min(1).default(50),
    bookingCutoffHours: Joi.number().integer().min(0).default(24),
  }).default(),
  inclusions: Joi.array().items(Joi.string().min(2).max(200)).min(1).max(50).required(),
  exclusions: Joi.array().items(Joi.string().min(2).max(200)).max(50).optional(),
  amenities: Joi.array().items(Joi.string().min(2).max(100)).max(50).optional(),
  tags: Joi.array().items(Joi.string().min(2).max(50)).max(30).optional(),
  languagesOffered: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10).default(['English']),
  cancellationPolicy: Joi.string().valid('flexible', 'moderate', 'strict', 'non_refundable').default('moderate'),
  transportType: Joi.string().valid(
    'cab', 'bus', 'train', 'flight', 'bike_rental', 'car_rental', 
    'van_rental', 'luxury_car', 'tempo_traveller', 'boat', 'ferry', 'helicopter'
  ).required(),
  fleetDetails: Joi.array().items(
    Joi.object({
      vehicleType: Joi.string().min(2).max(100).required().trim(),
      capacity: Joi.number().integer().min(1).max(100).required(),
      features: Joi.array().items(Joi.string().min(2).max(100)).max(30).optional(),
      pricePerKm: Joi.number().min(0).optional(),
      pricePerDay: Joi.number().min(0).optional(),
      images: Joi.array().items(Joi.string().uri()).max(10).optional(),
      registrationNumber: Joi.string().max(50).optional().trim(),
      insuranceValidUntil: Joi.date().iso().optional(),
      lastServiceDate: Joi.date().iso().optional(),
      nextServiceDue: Joi.date().iso().optional(),
      isActive: Joi.boolean().default(true),
    })
  ).min(1).max(50).required(),
  route: Joi.object({
    origin: Joi.string().min(2).max(200).required().trim(),
    destination: Joi.string().min(2).max(200).required().trim(),
    stops: Joi.array().items(Joi.string().min(2).max(200)).max(20).optional(),
    distanceKm: Joi.number().min(0).optional(),
    durationHours: Joi.number().min(0).optional(),
    routeDescription: Joi.string().max(2000).optional().trim().allow(''),
    waypoints: Joi.array().items(
      Joi.object({
        name: Joi.string().min(2).max(200).required().trim(),
        coordinates: Joi.array().items(Joi.number()).length(2).required(),
        stopDuration: Joi.number().integer().min(0).max(480).default(0),
      })
    ).max(20).optional(),
  }).required(),
  operatorDetails: Joi.object({
    operatorName: Joi.string().min(2).max(200).required().trim(),
    operatorContact: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required().messages({
      'string.pattern.base': 'Invalid phone number',
    }),
    operatorEmail: Joi.string().email().required().lowercase().trim(),
    licenseNumber: Joi.string().max(100).optional().trim(),
    licenseValidUntil: Joi.date().iso().optional(),
    yearsOfExperience: Joi.number().integer().min(0).max(100).default(0),
    safetyRating: Joi.number().min(1).max(5).default(5),
  }).optional(),
  isInstantBook: Joi.boolean().default(false),
  guideIds: Joi.array().items(Joi.string()).optional(),
}).messages({
  'object.missing': 'Either pricePerKm or pricePerDay must be provided for each fleet vehicle',
});

export const UpdateTransportDto = Joi.object({
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
  transportType: Joi.string().valid(
    'cab', 'bus', 'train', 'flight', 'bike_rental', 'car_rental',
    'van_rental', 'luxury_car', 'tempo_traveller', 'boat', 'ferry', 'helicopter'
  ),
  fleetDetails: Joi.array().items(
    Joi.object({
      vehicleType: Joi.string().min(2).max(100).trim(),
      capacity: Joi.number().integer().min(1).max(100),
      features: Joi.array().items(Joi.string().min(2).max(100)).max(30),
      pricePerKm: Joi.number().min(0),
      pricePerDay: Joi.number().min(0),
      images: Joi.array().items(Joi.string().uri()).max(10),
      registrationNumber: Joi.string().max(50).trim(),
      insuranceValidUntil: Joi.date().iso(),
      lastServiceDate: Joi.date().iso(),
      nextServiceDue: Joi.date().iso(),
      isActive: Joi.boolean(),
    })
  ).min(1).max(50),
  route: Joi.object({
    origin: Joi.string().min(2).max(200).trim(),
    destination: Joi.string().min(2).max(200).trim(),
    stops: Joi.array().items(Joi.string().min(2).max(200)).max(20),
    distanceKm: Joi.number().min(0),
    durationHours: Joi.number().min(0),
    routeDescription: Joi.string().max(2000).trim().allow(''),
    waypoints: Joi.array().items(
      Joi.object({
        name: Joi.string().min(2).max(200).trim(),
        coordinates: Joi.array().items(Joi.number()).length(2),
        stopDuration: Joi.number().integer().min(0).max(480),
      })
    ).max(20),
  }),
  operatorDetails: Joi.object({
    operatorName: Joi.string().min(2).max(200).trim(),
    operatorContact: Joi.string().pattern(/^\+91[6-9]\d{9}$/),
    operatorEmail: Joi.string().email().lowercase().trim(),
    licenseNumber: Joi.string().max(100).trim(),
    licenseValidUntil: Joi.date().iso(),
    yearsOfExperience: Joi.number().integer().min(0).max(100),
    safetyRating: Joi.number().min(1).max(5),
  }),
  isInstantBook: Joi.boolean(),
  guideIds: Joi.array().items(Joi.string()),
  status: Joi.string().valid('draft', 'pending_review', 'published', 'archived', 'suspended'),
});

export const TransportSearchDto = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'price', 'rating', 'bookingCount', 'reviewCount').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  destinationId: Joi.string().optional(),
  destinationSlug: Joi.string().optional(),
  transportType: Joi.string().valid(
    'cab', 'bus', 'train', 'flight', 'bike_rental', 'car_rental',
    'van_rental', 'luxury_car', 'tempo_traveller', 'boat', 'ferry', 'helicopter'
  ).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minCapacity: Joi.number().integer().min(1).max(100).optional(),
  maxCapacity: Joi.number().integer().min(1).max(100).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  isInstantBook: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  search: Joi.string().trim().max(100).optional(),
  status: Joi.string().valid('published', 'draft', 'pending_review').optional(),
  vendorId: Joi.string().optional(),
  origin: Joi.string().trim().max(200).optional(),
  destination: Joi.string().trim().max(200).optional(),
});

export const UpdateTransportStatusDto = Joi.object({
  status: Joi.string().valid('draft', 'pending_review', 'published', 'archived', 'suspended').required(),
  reason: Joi.string().max(500).optional().trim().allow(''),
});

export const CalculateTransportPriceDto = Joi.object({
  travelers: Joi.number().integer().min(1).max(100).required(),
  children: Joi.number().integer().min(0).max(50).default(0),
  infants: Joi.number().integer().min(0).max(50).default(0),
  distanceKm: Joi.number().min(0).optional(),
  days: Joi.number().integer().min(1).max(30).default(1),
  fleetVehicleIndex: Joi.number().integer().min(0).optional(),
  couponCode: Joi.string().uppercase().optional(),
});

export const UpdateFleetStatusDto = Joi.object({
  fleetIndex: Joi.number().integer().min(0).required(),
  isActive: Joi.boolean().required(),
  reason: Joi.string().max(500).optional().trim().allow(''),
});

export const TrackLocationDto = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  timestamp: Joi.date().iso().optional(),
  speed: Joi.number().min(0).optional(),
  heading: Joi.number().min(0).max(360).optional(),
});
