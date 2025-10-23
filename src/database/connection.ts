import { Pool, PoolClient } from 'pg';
import { DATABASE_CONFIG } from '../config/constants';
import logger from '../utils/logger';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_CONFIG.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected database pool error');
    });

    logger.info('Database pool created');
  }

  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ text, duration, rows: res.rowCount }, 'Executed query');
    return res;
  } catch (error) {
    logger.error({ error, text }, 'Database query error');
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool();
  const client = await pool.connect();
  return client;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
};
