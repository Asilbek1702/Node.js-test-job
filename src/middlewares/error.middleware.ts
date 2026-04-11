import { Request, Response, NextFunction } from 'express';

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
  console.error('[Error]:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error', data: null });
};
