import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './pool';

const EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const PASSWORD = process.env.ADMIN_PASSWORD;

const main = async (): Promise<void> => {
  if (!PASSWORD) {
    console.error('Error: ADMIN_PASSWORD env variable is required');
    console.error('Usage: ADMIN_PASSWORD=secret npm run seed:admin');
    process.exit(1);
  }

  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [EMAIL]
  );

  if (existing.rowCount && existing.rowCount > 0) {
    console.log(`Admin with email "${EMAIL}" already exists — skipping`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(PASSWORD, 10);

  const result = await pool.query(
    `INSERT INTO users (full_name, birth_date, email, password, role)
     VALUES ($1, $2, $3, $4, 'ADMIN')
     RETURNING id, email, role`,
    ['System Admin', '2000-01-01', EMAIL, hashed]
  );

  const admin = result.rows[0];
  console.log('Admin created successfully:');
  console.log(`  id:    ${admin.id}`);
  console.log(`  email: ${admin.email}`);
  console.log(`  role:  ${admin.role}`);
};

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
