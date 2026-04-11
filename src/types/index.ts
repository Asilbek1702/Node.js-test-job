import { Request } from 'express';

export type UserRole = 'ADMIN' | 'USER';

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface RegisterDto {
  fullName: string;
  birthDate: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface User {
  id: string;
  full_name: string;
  birth_date: Date;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<User, 'password'>;
