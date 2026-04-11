import 'dotenv/config';
import pool from './pool';

const createTables = async (): Promise<void> => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      full_name   VARCHAR(255)  NOT NULL,
      birth_date  DATE          NOT NULL,
      email       VARCHAR(255)  NOT NULL UNIQUE,
      password    VARCHAR(255)  NOT NULL,
      role        user_role     NOT NULL DEFAULT 'USER',
      is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `);

  console.log('✅ Database migrated successfully');
};

createTables()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
