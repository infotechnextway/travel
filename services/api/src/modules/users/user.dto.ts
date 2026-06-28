import Joi from 'joi';

export const UpdateProfileDto = Joi.object({
  firstName: Joi.string().min(2).max(50).trim(),
  lastName: Joi.string().min(2).max(50).trim(),
  bio: Joi.string().max(500).trim().allow(''),
  dateOfBirth: Joi.date().iso().less('now'),
  gender: Joi.string().valid('male', 'female', 'non_binary', 'prefer_not_to_say'),
  languagePreferences: Joi.array().items(Joi.string().min(2).max(10)),
  dietaryRestrictions: Joi.array().items(Joi.string()),
  emergencyContact: Joi.object({
    name: Joi.string().required().trim(),
    phone: Joi.string().required().trim(),
    relationship: Joi.string().required().trim(),
  }),
});

export const AddressDto = Joi.object({
  label: Joi.string().required().trim(),
  line1: Joi.string().required().trim(),
  line2: Joi.string().trim().allow(''),
  city: Joi.string().required().trim(),
  state: Joi.string().required().trim(),
  postalCode: Joi.string().required().trim(),
  country: Joi.string().trim().default('India'),
  coordinates: Joi.array().items(Joi.number()).length(2),
  isDefault: Joi.boolean().default(false),
});

export const KycDocumentDto = Joi.object({
  type: Joi.string().required().valid('aadhaar', 'pan', 'passport', 'driving_license', 'gstin'),
  url: Joi.string().required().uri(),
});

export const AvatarUploadDto = Joi.object({
  fileUrl: Joi.string().required().uri(),
});
