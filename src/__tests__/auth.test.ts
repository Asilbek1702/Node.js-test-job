import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.JWT_EXPIRES_IN = '1h';

import app from '../app';
import { Role } from '../types';

// ─── Mock store ───────────────────────────────────────────────────────────────
type MockUser = {
  id: string; full_name: string; birth_date: string; email: string;
  password: string; role: Role; is_active: boolean;
  created_at: Date; updated_at: Date;
};

// Shared mutable store — module scope so mock closure can access it
const store: { users: MockUser[] } = { users: [] };

jest.mock('../db/pool', () => ({
  __esModule: true,
  default: {
    query: jest.fn(async (sql: string, params: unknown[] = []) => {
      const s = sql.trim();
      const u = store.users;

      if (s.startsWith('INSERT INTO users')) {
        const user: MockUser = {
          id: `id-${Math.random().toString(36).slice(2, 9)}`,
          full_name: params[0] as string, birth_date: params[1] as string,
          email: params[2] as string, password: params[3] as string,
          role: (params[4] as Role) || Role.USER,
          is_active: true, created_at: new Date(), updated_at: new Date(),
        };
        u.push(user);
        return { rows: [user], rowCount: 1 };
      }
      if (s.includes('WHERE email =')) {
        const found = u.filter((x) => x.email === params[0]);
        return { rows: found, rowCount: found.length };
      }
      if (s.includes('COUNT(*)')) {
        return { rows: [{ count: String(u.length) }], rowCount: 1 };
      }
      if (s.includes('ORDER BY created_at DESC')) {
        return { rows: u, rowCount: u.length };
      }
      if (s.startsWith('UPDATE users')) {
        const idx = u.findIndex((x) => x.id === params[0]);
        if (idx !== -1) { u[idx].is_active = false; return { rows: [u[idx]], rowCount: 1 }; }
        return { rows: [], rowCount: 0 };
      }
      if (s.includes('WHERE id =')) {
        const found = u.filter((x) => x.id === params[0]);
        return { rows: found, rowCount: found.length };
      }
      return { rows: [], rowCount: 0 };
    }),
    on: jest.fn(),
  },
}));

beforeEach(() => { store.users = []; });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const reg = (overrides = {}) =>
  request(app).post('/api/users/register').send({
    fullName: 'Test User', birthDate: '1990-01-01',
    email: `u${Date.now()}@test.com`, password: 'password123', ...overrides,
  });

const login = (email: string, password: string) =>
  request(app).post('/api/users/login').send({ email, password });

// ─── Registration ─────────────────────────────────────────────────────────────
describe('POST /api/users/register', () => {
  it('returns 201 with token, no password in response', async () => {
    const res = await reg({ email: 'a@test.com' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('always assigns USER role even if ADMIN passed', async () => {
    const res = await reg({ email: 'b@test.com', role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe(Role.USER);
  });

  it('returns 409 on duplicate email', async () => {
    await reg({ email: 'dup@test.com' });
    const res = await reg({ email: 'dup@test.com' });
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid email', async () => {
    const res = await reg({ email: 'not-email' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for short password (<6 chars)', async () => {
    const res = await reg({ email: 'c@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app).post('/api/users/register').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid birthDate format', async () => {
    const res = await reg({ email: 'd@test.com', birthDate: '15-06-1990' });
    expect(res.status).toBe(400);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
describe('POST /api/users/login', () => {
  it('returns 401 for non-existent user', async () => {
    const res = await login('ghost@test.com', 'password123');
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    const hashed = await bcrypt.hash('correct', 10);
    store.users.push({
      id: 'id-wrongpass', full_name: 'X', birth_date: '1990-01-01',
      email: 'wp@test.com', password: hashed,
      role: Role.USER, is_active: true, created_at: new Date(), updated_at: new Date(),
    });
    const res = await login('wp@test.com', 'wrong');
    expect(res.status).toBe(401);
  });

  it('returns 401 for blocked user', async () => {
    const hashed = await bcrypt.hash('password123', 10);
    store.users.push({
      id: 'id-blocked', full_name: 'Blocked', birth_date: '1990-01-01',
      email: 'blocked@test.com', password: hashed,
      role: Role.USER, is_active: false, created_at: new Date(), updated_at: new Date(),
    });
    const res = await login('blocked@test.com', 'password123');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('blocked');
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/users/login').send({});
    expect(res.status).toBe(400);
  });
});

// ─── Access control ───────────────────────────────────────────────────────────
describe('GET /api/users/ [admin only]', () => {
  it('returns 401 without token', async () => {
    expect((await request(app).get('/api/users/')).status).toBe(401);
  });

  it('returns 403 for USER role', async () => {
    const r = await reg({ email: 'user@test.com' });
    const token = r.body.data.token;
    const res = await request(app).get('/api/users/').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/users/:id [admin or self]', () => {
  it('returns 403 when user accesses another user', async () => {
    const r1 = await reg({ email: 'u1@test.com' });
    const r2 = await reg({ email: 'u2@test.com' });
    const res = await request(app)
      .get(`/api/users/${r2.body.data.user.id}`)
      .set('Authorization', `Bearer ${r1.body.data.token}`);
    expect(res.status).toBe(403);
  });

  it('user can access their own profile', async () => {
    const r = await reg({ email: 'self@test.com' });
    const { token, user } = r.body.data;
    const res = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });
});

describe('PATCH /api/users/:id/block', () => {
  it('user cannot block another user', async () => {
    const r1 = await reg({ email: 'blocker@test.com' });
    const r2 = await reg({ email: 'victim@test.com' });
    const res = await request(app)
      .patch(`/api/users/${r2.body.data.user.id}/block`)
      .set('Authorization', `Bearer ${r1.body.data.token}`);
    expect(res.status).toBe(403);
  });

  it('user can block themselves', async () => {
    const r = await reg({ email: 'selfblock@test.com' });
    const { token, user } = r.body.data;
    const res = await request(app)
      .patch(`/api/users/${user.id}/block`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
