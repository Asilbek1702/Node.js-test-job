import request from 'supertest';

// Set env before app loads
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

import app from '../app';

jest.mock('../db/pool', () => {
  const mockUsers: Record<string, unknown>[] = [];

  return {
    __esModule: true,
    default: {
      query: jest.fn(async (sql: string, params: unknown[] = []) => {
        const s = sql.trim();

        // INSERT user
        if (s.startsWith('INSERT INTO users')) {
          const user = {
            id: 'test-uuid-1234',
            full_name: params[0],
            birth_date: params[1],
            email: params[2],
            password: params[3],
            role: params[4] || 'USER',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          };
          mockUsers.push(user);
          return { rows: [user], rowCount: 1 };
        }

        // SELECT by email (check existing)
        if (s.includes('WHERE email =')) {
          const found = mockUsers.filter((u) => u['email'] === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT all
        if (s.includes('FROM users ORDER BY')) {
          return { rows: mockUsers, rowCount: mockUsers.length };
        }

        // SELECT by id
        if (s.includes('WHERE id =')) {
          const found = mockUsers.filter((u) => u['id'] === params[0]);
          return { rows: found, rowCount: found.length };
        }

        return { rows: [], rowCount: 0 };
      }),
      on: jest.fn(),
    },
  };
});

describe('POST /api/users/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/users/register').send({
      fullName: 'Test User',
      birthDate: '1990-01-01',
      email: 'test@example.com',
      password: 'password123',
      role: 'USER',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('returns 409 if email already exists', async () => {
    const res = await request(app).post('/api/users/register').send({
      fullName: 'Test User',
      birthDate: '1990-01-01',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 if required fields missing', async () => {
    const res = await request(app).post('/api/users/register').send({
      email: 'incomplete@example.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/users/register').send({
      fullName: 'Test',
      birthDate: '1990-01-01',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for short password', async () => {
    const res = await request(app).post('/api/users/register').send({
      fullName: 'Test',
      birthDate: '1990-01-01',
      email: 'test2@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/users/login', () => {
  it('returns 400 if body is empty', async () => {
    const res = await request(app).post('/api/users/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong credentials', async () => {
    const res = await request(app).post('/api/users/login').send({
      email: 'nobody@example.com',
      password: 'wrongpass',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/users/')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
