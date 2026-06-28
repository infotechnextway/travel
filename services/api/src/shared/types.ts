import { Request } from 'express';
import { Permission } from './enums';

export interface TokenPayload {
  userId: string;
  role: string;
  permissions: string[];
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    permissions: string[];
    email: string;
    phone: string;
  };
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
