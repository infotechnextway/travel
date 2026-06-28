import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors';
import { errorResponse } from '@shared/utils/response';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    errorResponse(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err.name === 'ValidationError' && (err as any).errors) {
    const mongooseError = err as any;
    const details = Object.keys(mongooseError.errors).map((key) => ({
      field: key,
      message: mongooseError.errors[key].message,
    }));
    errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
    return;
  }

  if (err.name === 'CastError') {
    errorResponse(res, 400, 'CAST_ERROR', 'Invalid ID format');
    return;
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const key = Object.keys((err as any).keyValue)[0];
    errorResponse(res, 409, 'DUPLICATE_KEY', `${key} already exists`);
    return;
  }

  console.error('Unhandled error:', err);
  errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
};
