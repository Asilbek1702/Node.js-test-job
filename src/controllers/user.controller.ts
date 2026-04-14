import { Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest, Role } from '../types';

export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await userService.registerUser(req.body);
    sendSuccess(res, result, 201, 'User registered successfully');
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await userService.loginUser(req.body);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.getUserById(req.user!.userId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params['id'] as string);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 10));
    const role = req.query['role'] as Role | undefined;
    const isActiveRaw = req.query['isActive'] as string | undefined;
    const isActive =
      isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;

    const result = await userService.getAllUsers(page, limit, role, isActive);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const blockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.blockUser(req.params['id'] as string);
    sendSuccess(res, user, 200, 'User blocked successfully');
  } catch (err) {
    next(err);
  }
};
