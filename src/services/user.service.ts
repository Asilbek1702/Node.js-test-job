import bcrypt from 'bcryptjs';
import pool from '../db/pool';
import { signToken } from '../utils/jwt';
import { RegisterDto, LoginDto, User, SafeUser } from '../types';

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
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
  const role = dto.role ?? 'USER';

  const result = await pool.query<User>(
    `INSERT INTO users (full_name, birth_date, email, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [dto.fullName, dto.birthDate, dto.email, hashedPassword, role]
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
    throw new Error('Invalid email or password');
  }

  if (!user.is_active) {
    throw new Error('Account is blocked');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
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
    throw new Error('User not found');
  }

  return result.rows[0] as SafeUser;
};

export const getAllUsers = async (): Promise<SafeUser[]> => {
  const result = await pool.query<SafeUser>(
    `SELECT id, full_name, birth_date, email, role, is_active, created_at, updated_at
     FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

export const blockUser = async (targetId: string): Promise<SafeUser> => {
  const check = await pool.query<User>(
    'SELECT id FROM users WHERE id = $1',
    [targetId]
  );

  if (!check.rows[0]) {
    throw new Error('User not found');
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
