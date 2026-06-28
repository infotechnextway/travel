import Joi from 'joi';

export const ApplyReferralDto = Joi.object({
  code: Joi.string().trim().min(3).max(50).required()
});

export const UpdateReferralBonusDto = Joi.object({
  referrerBonusPoints: Joi.number().integer().min(0).optional(),
  referrerBonusWallet: Joi.number().min(0).optional(),
  refereeBonusPoints: Joi.number().integer().min(0).optional(),
  refereeBonusWallet: Joi.number().min(0).optional()
}).min(1);

export const ReferralSearchDto = Joi.object({
  status: Joi.string().valid('pending', 'registered', 'booked', 'completed', 'expired').optional(),
  referrerId: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
