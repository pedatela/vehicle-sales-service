import { Pool } from 'pg';
import { databaseConfig } from '../../config/database';

let pool: Pool | null = null;

export const getPostgresPool = (): Pool => {
  if (!databaseConfig.enabled) {
    throw new Error('Database config is missing for PostgreSQL repository');
  }

  if (!pool) {
    pool = new Pool({
      host: databaseConfig.host,
      port: databaseConfig.port,
      database: databaseConfig.database,
      user: databaseConfig.user,
      password: databaseConfig.password,
      ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false
    });
  }

  return pool;
};

export const closePostgresPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
