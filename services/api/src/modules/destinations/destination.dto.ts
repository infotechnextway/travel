import Joi from 'joi';

export const CreateDestinationDto = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  slug: Joi.string().min(2).max(100).required().trim().lowercase().pattern(/^[a-z0-9-]+$/).messages({
    'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
  }),
  type: Joi.string().valid('country', 'state', 'city', 'locality').required(),
  parentId: Joi.string().optional().allow('').when('type', {
    is: Joi.valid('country'),
    then: Joi.optional().allow(''),
    otherwise: Joi.required(),
  }),
  description: Joi.string().min(50).max(5000).required().trim(),
  shortDescription: Joi.string().max(300).optional().allow('').trim(),
  images: Joi.array().items(Joi.string().uri()).max(20).default([]),
  coverImage: Joi.string().uri().optional().allow(''),
  tags: Joi.array().items(Joi.string().min(2).max(50)).max(20).default([]),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).required(),
  bestTimeToVisit: Joi.object({
    months: Joi.array().items(
      Joi.string().valid('January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December')
    ).min(1).max(12).required(),
    notes: Joi.string().max(1000).optional().allow('').trim(),
  }).required(),
  weather: Joi.object({
    summer: Joi.object({
      temp: Joi.string().max(50).required(),
      notes: Joi.string().max(500).optional().allow('').trim(),
    }).optional(),
    monsoon: Joi.object({
      temp: Joi.string().max(50).required(),
      notes: Joi.string().max(500).optional().allow('').trim(),
    }).optional(),
    winter: Joi.object({
      temp: Joi.string().max(50).required(),
      notes: Joi.string().max(500).optional().allow('').trim(),
    }).optional(),
  }).optional(),
  safetyIndex: Joi.number().min(1).max(10).default(5),
  isFeatured: Joi.boolean().default(false),
  seo: Joi.object({
    title: Joi.string().max(100).optional().allow('').trim(),
    description: Joi.string().max(300).optional().allow('').trim(),
    keywords: Joi.array().items(Joi.string().min(2).max(50)).max(20).default([]),
  }).optional(),
  content: Joi.object({
    history: Joi.string().max(10000).optional().allow('').trim(),
    culture: Joi.string().max(10000).optional().allow('').trim(),
    cuisine: Joi.string().max(5000).optional().allow('').trim(),
    howToReach: Joi.string().max(5000).optional().allow('').trim(),
  }).optional(),
});

export const UpdateDestinationDto = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional(),
  slug: Joi.string().min(2).max(100).trim().lowercase().pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().min(50).max(5000).trim().optional(),
  shortDescription: Joi.string().max(300).optional().allow('').trim(),
  images: Joi.array().items(Joi.string().uri()).max(20).optional(),
  coverImage: Joi.string().uri().optional().allow(''),
  tags: Joi.array().items(Joi.string().min(2).max(50)).max(20).optional(),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).optional(),
  bestTimeToVisit: Joi.object({
    months: Joi.array().items(
      Joi.string().valid('January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December')
    ).min(1).max(12).optional(),
    notes: Joi.string().max(1000).optional().allow('').trim(),
  }).optional(),
  weather: Joi.object({
    summer: Joi.object({
      temp: Joi.string().max(50).optional(),
      notes: Joi.string().max(500).optional().allow('').trim(),
    }).optional(),
    monsoon: Joi.object({
      temp: Joi.string().max(50).optional(),
      notes: Joi.string().max(500).optional().allow('').trim(),
    }).optional(),
    winter: Joi.object({
      temp: Joi.string().max(50).optional(),
      notes: Joi.string().max(500).optional().allow('').trim(),
    }).optional(),
  }).optional(),
  safetyIndex: Joi.number().min(1).max(10).optional(),
  isFeatured: Joi.boolean().optional(),
  seo: Joi.object({
    title: Joi.string().max(100).optional().allow('').trim(),
    description: Joi.string().max(300).optional().allow('').trim(),
    keywords: Joi.array().items(Joi.string().min(2).max(50)).max(20).optional(),
  }).optional(),
  content: Joi.object({
    history: Joi.string().max(10000).optional().allow('').trim(),
    culture: Joi.string().max(10000).optional().allow('').trim(),
    cuisine: Joi.string().max(5000).optional().allow('').trim(),
    howToReach: Joi.string().max(5000).optional().allow('').trim(),
  }).optional(),
});

export const DestinationSearchDto = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('name', 'createdAt', 'updatedAt', 'safetyIndex', 'rating').default('name'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  type: Joi.string().valid('country', 'state', 'city', 'locality').optional(),
  parentId: Joi.string().optional().allow(''),
  tags: Joi.string().optional(),
  isFeatured: Joi.boolean().optional(),
  search: Joi.string().max(100).optional().allow(''),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  radius: Joi.number().min(1).max(500).default(50).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
});

export const UpdateContentDto = Joi.object({
  history: Joi.string().max(10000).optional().allow('').trim(),
  culture: Joi.string().max(10000).optional().allow('').trim(),
  cuisine: Joi.string().max(5000).optional().allow('').trim(),
  howToReach: Joi.string().max(5000).optional().allow('').trim(),
}).min(1);

export const UpdateWeatherDto = Joi.object({
  summer: Joi.object({
    temp: Joi.string().max(50).optional(),
    notes: Joi.string().max(500).optional().allow('').trim(),
  }).optional(),
  monsoon: Joi.object({
    temp: Joi.string().max(50).optional(),
    notes: Joi.string().max(500).optional().allow('').trim(),
  }).optional(),
  winter: Joi.object({
    temp: Joi.string().max(50).optional(),
    notes: Joi.string().max(500).optional().allow('').trim(),
  }).optional(),
}).min(1);

export const BulkDestinationActionDto = Joi.object({
  destinationIds: Joi.array().items(Joi.string().required()).min(1).max(100).required(),
  action: Joi.string().valid('feature', 'unfeature', 'activate', 'deactivate').required(),
});
