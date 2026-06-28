import Joi from 'joi';

export const BurnPointsDto = Joi.object({
  points: Joi.number().integer().min(1).max(100000).required(),
  bookingId: Joi.string().uuid().required()
});

export const ManualRewardDto = Joi.object({
  userId: Joi.string().uuid().required(),
  points: Joi.number().integer().min(1).max(100000).required(),
  description: Joi.string().trim().min(5).max(500).required(),
  expiryDays: Joi.number().integer().min(1).max(365).default(365)
});

export const RewardSearchDto = Joi.object({
  userId: Joi.string().uuid().optional(),
  type: Joi.string().valid('earned', 'burned', 'expired', 'bonus', 'reversed').optional(),
  source: Joi.string().valid('booking', 'referral', 'tier_bonus', 'promotion', 'manual', 'review', 'signup').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
