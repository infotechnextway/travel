import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import { successResponse } from '@shared/utils/response';
import { AuthenticatedRequest } from '@shared/types';

export class AuthController {
  constructor(
    private authService: AuthService,
    private socialAuthService: SocialAuthService
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      successResponse(res, result, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokens = await this.authService.refreshToken(req.body.refreshToken);
      successResponse(res, tokens);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logout(req.body.refreshToken);
      successResponse(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logoutAll(req.user!.userId);
      successResponse(res, { message: 'Logged out from all devices' });
    } catch (error) {
      next(error);
    }
  };

  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.sendOtp(req.body.phone);
      successResponse(res, { message: 'OTP sent successfully' });
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.verifyOtp(req.body.phone, req.body.code);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.socialAuthService.googleAuth(req.body.token);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  appleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.socialAuthService.appleAuth(req.body.token, req.body.idToken);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.forgotPassword(req.body.email);
      successResponse(res, { message: 'If the email exists, password reset instructions have been sent' });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.resetPassword(req.body.token, req.body.password);
      successResponse(res, { message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.changePassword(
        req.user!.userId,
        req.body.oldPassword,
        req.body.newPassword
      );
      successResponse(res, { message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  };

  setupMfa = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.setupMfa(req.user!.userId);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  verifyMfaSetup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.verifyMfaSetup(req.user!.userId, req.body.code);
      successResponse(res, { message: 'MFA enabled successfully' });
    } catch (error) {
      next(error);
    }
  };
}
