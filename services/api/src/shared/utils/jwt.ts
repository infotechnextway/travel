import jwt from 'jsonwebtoken';
import { config } from '@config';
import { TokenPayload } from '@shared/types';
import { UnauthorizedError } from '@shared/errors';

export class JwtService {
  generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      config.jwtSecret,
      { expiresIn: config.jwtAccessExpiration }
    );
  }

  generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiration }
    );
  }

  generatePasswordResetToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}
