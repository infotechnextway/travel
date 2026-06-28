import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta: Record<string, unknown> | null;
  error: { code: string; message: string; details?: unknown } | null;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: meta || null,
    error: null,
  };
  res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void => {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    meta: null,
    error: { code, message, details },
  };
  res.status(statusCode).json(response);
};
