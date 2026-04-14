import { Request } from 'express';

// ─── Enums ────────────────────────────────────────────────────────────────────
export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthPayload {
  userId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
export interface RegisterDto {
  fullName: string;
  birthDate: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ─── DB Model ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  full_name: string;
  birth_date: Date;
  email: string;
  password: string;
  role: Role;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<User, 'password'>;

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
