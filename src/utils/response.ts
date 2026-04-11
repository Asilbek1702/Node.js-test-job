import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
) => {
  res.status(statusCode).json({
    success: true,
    message: message ?? 'OK',
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400
) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};
