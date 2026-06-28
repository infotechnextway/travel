import Joi from 'joi';

export const CreateReviewDto = Joi.object({
  bookingId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  dimensions: Joi.object({
    cleanliness: Joi.number().integer().min(1).max(5).required(),
    value: Joi.number().integer().min(1).max(5).required(),
    communication: Joi.number().integer().min(1).max(5).required(),
    location: Joi.number().integer().min(1).max(5).required(),
    accuracy: Joi.number().integer().min(1).max(5).required(),
    service: Joi.number().integer().min(1).max(5).required(),
    amenities: Joi.number().integer().min(1).max(5).required()
  }).required(),
  title: Joi.string().trim().min(5).max(200).required(),
  comment: Joi.string().trim().min(20).max(5000).required(),
  media: Joi.array().items(Joi.object({
    type: Joi.string().valid('image', 'video').required(),
    url: Joi.string().uri().required(),
    thumbnailUrl: Joi.string().uri().optional(),
    caption: Joi.string().trim().max(200).optional()
  })).max(10).optional()
});

export const UpdateReviewDto = Joi.object({
  title: Joi.string().trim().min(5).max(200).optional(),
  comment: Joi.string().trim().min(20).max(5000).optional(),
  media: Joi.array().items(Joi.object({
    type: Joi.string().valid('image', 'video').required(),
    url: Joi.string().uri().required(),
    thumbnailUrl: Joi.string().uri().optional(),
    caption: Joi.string().trim().max(200).optional()
  })).max(10).optional()
}).min(1);

export const VendorResponseDto = Joi.object({
  text: Joi.string().trim().min(10).max(2000).required()
});

export const ModerateReviewDto = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'flagged').required(),
  reason: Joi.string().trim().min(5).max(500).required()
});

export const ReportReviewDto = Joi.object({
  reason: Joi.string().trim().min(10).max(500).required()
});

export const VoteReviewDto = Joi.object({
  isHelpful: Joi.boolean().required()
});

export const ReviewSearchDto = Joi.object({
  listingId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().optional(),
  customerId: Joi.string().uuid().optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  hasPhotos: Joi.boolean().optional(),
  hasResponse: Joi.boolean().optional(),
  sortBy: Joi.string().valid('recent', 'helpful', 'highest', 'lowest').default('recent'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

export const AdminReviewSearchDto = Joi.object({
  moderationStatus: Joi.string().valid('pending', 'approved', 'rejected', 'flagged').optional(),
  listingId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().optional(),
  search: Joi.string().trim().max(200).optional(),
  reported: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const BulkReviewActionDto = Joi.object({
  reviewIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  action: Joi.string().valid('approve', 'reject', 'delete', 'flag').required(),
  reason: Joi.string().trim().min(5).max(500).required()
});
