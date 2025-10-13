/**
 * PostgreSQL Database Connection
 *
 * Uses node-postgres (pg) for database queries
 */

import pg from 'pg';

const { Pool } = pg;

// Lazy initialization of pool
let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    console.log('Creating database pool with URL:', process.env.APPOINTMENTS_DATABASE_URL ? 'SET' : 'NOT SET');
    pool = new Pool({
      connectionString: process.env.APPOINTMENTS_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Neon
      }
    });

    // Test connection on startup
    pool.on('connect', () => {
      console.log('✓ Connected to appointments database');
    });

    pool.on('error', (err) => {
      console.error('❌ Database connection error:', err);
      process.exit(-1);
    });
  }
  return pool;
}

/**
 * Helper function to execute queries
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query: ${text.substring(0, 50)}... (${duration}ms)`);
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}
