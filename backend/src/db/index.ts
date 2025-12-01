import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { logger } from '../utils/logger';

// Create PostgreSQL connection pool with production-ready config
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'maidsofhonor',

  // Connection pool settings
  max: Number(process.env.DB_POOL_MAX) || 20, // Maximum connections in pool
  min: Number(process.env.DB_POOL_MIN) || 2, // Minimum connections to keep alive
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast if can't connect in 5s
  maxUses: 7500, // Recycle connections after 7500 uses (prevents memory leaks)

  // Enable statement timeouts (prevent runaway queries)
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT) || 60000, // 60s max query time
});

// Log pool errors
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

// Log when pool connects
pool.on('connect', () => {
  logger.debug('New database connection established');
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Export pool for health checks
export { pool };

// Export schema for use in other files
export * from './schema';
