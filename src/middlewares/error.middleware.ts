import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: 'Route not found', data: null });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
    return;
  }

  // Unexpected error — log and return 500
  console.error('[Unexpected Error]:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: null,
  });
};
