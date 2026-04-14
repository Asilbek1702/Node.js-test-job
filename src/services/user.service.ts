import bcrypt from 'bcryptjs';
import pool from '../db/pool';
import { signToken } from '../utils/jwt';
import { RegisterDto, LoginDto, User, SafeUser, Role, PaginatedResult } from '../types';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors';

const SALT_ROUNDS = 10;

const toSafeUser = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pwd, ...safe } = user;
  return safe;
};

export const registerUser = async (dto: RegisterDto) => {
  const existing = await pool.query<User>(
    'SELECT id FROM users WHERE email = $1',
    [dto.email]
  );
  if (existing.rowCount && existing.rowCount > 0) {
    throw new ConflictError('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const result = await pool.query<User>(
    `INSERT INTO users (full_name, birth_date, email, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [dto.fullName, dto.birthDate, dto.email, hashedPassword, Role.USER]
  );

  const user = result.rows[0];
  const token = signToken({ userId: user.id, role: user.role });

  return { user: toSafeUser(user), token };
};

export const loginUser = async (dto: LoginDto) => {
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE email = $1',
    [dto.email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('Your account has been blocked');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signToken({ userId: user.id, role: user.role });

  return { user: toSafeUser(user), token };
};

export const getUserById = async (id: string): Promise<SafeUser> => {
  const result = await pool.query<User>(
    `SELECT id, full_name, birth_date, email, role, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );

  if (!result.rows[0]) {
    throw new NotFoundError('User');
  }

  return result.rows[0] as SafeUser;
};

export const getAllUsers = async (
  page: number,
  limit: number,
  role?: Role,
  isActive?: boolean
): Promise<PaginatedResult<SafeUser>> => {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (role !== undefined) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }
  if (isActive !== undefined) {
    params.push(isActive);
    conditions.push(`is_active = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit);
  params.push(offset);

  const result = await pool.query<SafeUser>(
    `SELECT id, full_name, birth_date, email, role, is_active, created_at, updated_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const blockUser = async (targetId: string): Promise<SafeUser> => {
  const check = await pool.query<User>(
    'SELECT id FROM users WHERE id = $1',
    [targetId]
  );

  if (!check.rows[0]) {
    throw new NotFoundError('User');
  }

  const result = await pool.query<User>(
    `UPDATE users
     SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, full_name, birth_date, email, role, is_active, created_at, updated_at`,
    [targetId]
  );

  return result.rows[0] as SafeUser;
};
