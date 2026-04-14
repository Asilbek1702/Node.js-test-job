import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AuthRequest, Role } from '../types';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Unauthorized: no token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    sendError(res, 'Unauthorized: invalid or expired token', 401);
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== Role.ADMIN) {
    sendError(res, 'Forbidden: admin access only', 403);
    return;
  }
  next();
};

export const requireSelfOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const targetId = req.params['id'];
  const { userId, role } = req.user!;

  if (role !== Role.ADMIN && userId !== targetId) {
    sendError(res, 'Forbidden: insufficient permissions', 403);
    return;
  }
  next();
};
