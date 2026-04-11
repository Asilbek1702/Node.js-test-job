import { Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, RegisterDto, LoginDto } from '../types';

export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto: RegisterDto = req.body;

    if (!dto.fullName || !dto.birthDate || !dto.email || !dto.password) {
      sendError(res, 'fullName, birthDate, email and password are required', 400);
      return;
    }

    const result = await userService.registerUser(dto);
    sendSuccess(res, result, 201, 'User registered successfully');
  } catch (err) {
    if (err instanceof Error && err.message.includes('already exists')) {
      sendError(res, err.message, 409);
      return;
    }
    next(err);
  }
};

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto: LoginDto = req.body;

    if (!dto.email || !dto.password) {
      sendError(res, 'email and password are required', 400);
      return;
    }

    const result = await userService.loginUser(dto);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (err) {
    if (err instanceof Error) {
      const isAuthError =
        err.message.includes('Invalid email') || err.message.includes('blocked');
      if (isAuthError) {
        sendError(res, err.message, 401);
        return;
      }
    }
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
    const id = req.params['id'] as string;
    const requesterId = req.user!.userId;
    const requesterRole = req.user!.role;

    // Только admin или сам пользователь
    if (requesterRole !== 'ADMIN' && requesterId !== id) {
      sendError(res, 'Forbidden: you can only view your own profile', 403);
      return;
    }

    const user = await userService.getUserById(id);
    sendSuccess(res, user);
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      sendError(res, err.message, 404);
      return;
    }
    next(err);
  }
};

export const getAllUsers = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    sendSuccess(res, users);
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
    const id = req.params['id'] as string;
    const requesterId = req.user!.userId;
    const requesterRole = req.user!.role;

    // Только admin или сам пользователь
    if (requesterRole !== 'ADMIN' && requesterId !== id) {
      sendError(res, 'Forbidden: you can only block your own account', 403);
      return;
    }

    const user = await userService.blockUser(id);
    sendSuccess(res, user, 200, 'User blocked successfully');
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      sendError(res, err.message, 404);
      return;
    }
    next(err);
  }
};
