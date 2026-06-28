import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@shared/utils/jwt';
import { AuthenticatedRequest } from '@shared/types';
import { Permission } from '@shared/enums';
import { UnauthorizedError, ForbiddenError } from '@shared/errors';

const jwtService = new JwtService();

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwtService.verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
      permissions: payload.permissions,
      email: '',
      phone: '',
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...permissions: Permission[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const hasPermission = permissions.some((p) =>
        req.user!.permissions.includes(p)
      );

      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = jwtService.verifyAccessToken(token);
      req.user = {
        userId: payload.userId,
        role: payload.role,
        permissions: payload.permissions,
        email: '',
        phone: '',
      };
    }

    next();
  } catch {
    next();
  }
};
