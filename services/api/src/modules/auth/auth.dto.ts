import Joi from 'joi';

export const RegisterDto = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Phone must be a valid Indian number (+91XXXXXXXXXX)',
  }),
  password: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
    }),
  firstName: Joi.string().min(2).max(50).required().trim(),
  lastName: Joi.string().min(2).max(50).required().trim(),
  role: Joi.string().valid('customer', 'vendor', 'guide').default('customer'),
});

export const LoginDto = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).optional().messages({
    'string.pattern.base': 'Phone must be a valid Indian number',
  }),
  password: Joi.string().required(),
}).xor('email', 'phone').messages({
  'object.missing': 'Either email or phone is required',
});

export const OtpSendDto = Joi.object({
  phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Phone must be a valid Indian number',
  }),
});

export const OtpVerifyDto = Joi.object({
  phone: Joi.string().pattern(/^\+91[6-9]\d{9}$/).required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'OTP must be exactly 6 digits',
  }),
});

export const RefreshTokenDto = Joi.object({
  refreshToken: Joi.string().required(),
});

export const SocialAuthDto = Joi.object({
  token: Joi.string().required(),
  idToken: Joi.string().optional(),
  provider: Joi.string().valid('google', 'apple').required(),
});

export const ForgotPasswordDto = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
});

export const ResetPasswordDto = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
    }),
});

export const ChangePasswordDto = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
    }),
});

export const MfaVerifyDto = Joi.object({
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'MFA code must be exactly 6 digits',
  }),
});
