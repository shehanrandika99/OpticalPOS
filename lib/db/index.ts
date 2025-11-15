/**
 * Database connection pool and utilities
 * Production-ready PostgreSQL connection management
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/utils/logger';
import type { DatabaseConnectionResult, DatabaseConfig } from '@/lib/types/database';

// Parse SSL mode from connection string or use secure defaults
const getSSLConfig = () => {
  const connectionString = env.DATABASE_URL;
  
  // Neon and most cloud providers use SSL but may require rejectUnauthorized: false
  // Check if it's a Neon connection (contains 'neon.tech' or 'pooler')
  const isNeon = connectionString.includes('neon.tech') || connectionString.includes('pooler');
  
  // For Neon and most cloud providers, we need rejectUnauthorized: false
  // even though SSL is required, because they use managed certificates
  if (isNeon || connectionString.includes('sslmode=require')) {
    return {
      rejectUnauthorized: false, // Cloud providers manage certificates
    };
  }
  
  // For production with custom databases, use strict SSL
  if (env.IS_PRODUCTION) {
    return {
      rejectUnauthorized: true,
    };
  }
  
  // Development fallback
  return {
    rejectUnauthorized: false,
  };
};

// Database pool configuration
const poolConfig: DatabaseConfig = {
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  min: env.DB_POOL_MIN,
  idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT,
  connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT,
  ssl: getSSLConfig(),
};

// Create connection pool with proper configuration
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected database pool error', err, {
    code: 'POOL_ERROR',
  });
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('remove', () => {
  logger.debug('Database connection removed from pool');
});

/**
 * Test database connection with timeout
 * Returns connection status with timestamp
 */
export async function testConnection(): Promise<DatabaseConnectionResult> {
  let client: PoolClient | null = null;
  let timeoutId: NodeJS.Timeout | null = null;
  
  try {
    // Create a timeout promise first
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Database connection timeout after 5 seconds'));
      }, 5000); // 5 second timeout
    });
    
    // Race between connection and timeout
    const connectionPromise = (async () => {
      try {
        // Acquire connection from pool
        client = await pool.connect();
        
        // Test query
        const result: QueryResult<{ now: Date }> = await client.query('SELECT NOW() as now');
        
        if (!result.rows || result.rows.length === 0) {
          throw new Error('Database query returned no results');
        }
        
        const timestamp = result.rows[0].now;
        
        logger.info('Database connection test successful', {
          timestamp: timestamp.toISOString(),
        });
        
        // Clear timeout if connection succeeded
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        return {
          success: true,
          message: 'Database connected successfully!',
          timestamp: timestamp.toISOString(),
        } as DatabaseConnectionResult;
      } catch (err) {
        // Clear timeout on error too
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        throw err;
      }
    })();
    
    // Race the connection against the timeout
    return await Promise.race([connectionPromise, timeoutPromise]);
  } catch (error) {
    // Clear timeout in case of error
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR';
    
    // Check if it's a timeout error
    if (errorMessage.includes('timeout')) {
      logger.error('Database connection test timed out', error, {
        code: 'CONNECTION_TIMEOUT',
      });
      
      return {
        success: false,
        message: 'Database connection timed out. Please check your connection string and network.',
        error: 'Connection timeout after 5 seconds',
        errorCode: 'CONNECTION_TIMEOUT',
      };
    }
    
    logger.error('Database connection test failed', error, {
      code: errorCode,
    });
    
    return {
      success: false,
      message: 'Database connection failed',
      error: errorMessage,
      errorCode,
    };
  } finally {
    // Always release the client back to the pool
    if (client) {
      (client as PoolClient).release();
    }
    // Clean up timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Execute a database query with proper error handling
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Database query executed', {
      query: text.substring(0, 100), // Log first 100 chars
      duration: `${duration}ms`,
      rowCount: result.rowCount,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('Database query failed', error, {
      query: text.substring(0, 100),
      duration: `${duration}ms`,
    });
    
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * Remember to release it when done!
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Gracefully close the database pool
 * Should be called on application shutdown
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool', error);
    throw error;
  }
}

/**
 * Get pool statistics for monitoring
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Export the pool for advanced usage
export { pool };

