import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '@shared/errors';

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.ip || 'unknown'),
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Rate limit exceeded. Please try again later.'));
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.ip || 'unknown'),
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many authentication attempts. Please try again later.'));
  },
});

export const otpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.ip || 'unknown'),
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many OTP requests. Please try again in an hour.'));
  },
});

export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.ip || 'unknown'),
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many password reset requests. Please try again later.'));
  },
});
