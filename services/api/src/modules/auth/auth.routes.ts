import { Router } from 'express';
import { authController } from '@shared/container';
import { validate } from '@shared/middleware/validation.middleware';
import { authenticate } from '@shared/middleware/auth.middleware';
import {
  generalRateLimit,
  authRateLimit,
  otpRateLimit,
  passwordResetRateLimit,
} from '@shared/middleware/rate-limit.middleware';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  OtpSendDto,
  OtpVerifyDto,
  SocialAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MfaVerifyDto,
} from './auth.dto';

const router = Router();

// Public auth endpoints
router.post('/register', generalRateLimit, validate(RegisterDto), authController.register);
router.post('/login', authRateLimit, validate(LoginDto), authController.login);
router.post('/refresh', generalRateLimit, validate(RefreshTokenDto), authController.refreshToken);
router.post('/otp/send', otpRateLimit, validate(OtpSendDto), authController.sendOtp);
router.post('/otp/verify', generalRateLimit, validate(OtpVerifyDto), authController.verifyOtp);
router.post('/social/google', generalRateLimit, validate(SocialAuthDto), authController.googleAuth);
router.post('/social/apple', generalRateLimit, validate(SocialAuthDto), authController.appleAuth);
router.post('/forgot-password', passwordResetRateLimit, validate(ForgotPasswordDto), authController.forgotPassword);
router.post('/reset-password', generalRateLimit, validate(ResetPasswordDto), authController.resetPassword);

// Protected auth endpoints
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validate(ChangePasswordDto), authController.changePassword);
router.post('/mfa/setup', authenticate, authController.setupMfa);
router.post('/mfa/verify', authenticate, validate(MfaVerifyDto), authController.verifyMfaSetup);

export default router;
