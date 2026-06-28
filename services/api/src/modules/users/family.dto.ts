import Joi from 'joi';

export const AddFamilyMemberDto = Joi.object({
  firstName: Joi.string().min(2).max(50).required().trim(),
  lastName: Joi.string().min(2).max(50).required().trim(),
  relationship: Joi.string().valid('spouse', 'child', 'parent', 'sibling', 'friend', 'other').required(),
  dateOfBirth: Joi.date().iso().less('now').required(),
  gender: Joi.string().valid('male', 'female', 'non_binary', 'prefer_not_to_say').optional(),
  passportNumber: Joi.string().max(20).trim().optional().allow(''),
  aadhaarNumber: Joi.string().pattern(/^\d{12}$/).optional().allow('').messages({
    'string.pattern.base': 'Aadhaar must be exactly 12 digits',
  }),
  dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
  specialNeeds: Joi.string().max(500).optional().allow(''),
});

export const UpdateFamilyMemberDto = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().optional(),
  lastName: Joi.string().min(2).max(50).trim().optional(),
  relationship: Joi.string().valid('spouse', 'child', 'parent', 'sibling', 'friend', 'other').optional(),
  dateOfBirth: Joi.date().iso().less('now').optional(),
  gender: Joi.string().valid('male', 'female', 'non_binary', 'prefer_not_to_say').optional(),
  passportNumber: Joi.string().max(20).trim().optional().allow(''),
  aadhaarNumber: Joi.string().pattern(/^\d{12}$/).optional().allow(''),
  dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
  specialNeeds: Joi.string().max(500).optional().allow(''),
});
