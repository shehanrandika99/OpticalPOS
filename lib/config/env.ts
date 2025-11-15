/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present at startup
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please check your .env.local file or environment configuration.`
    );
  }
  
  return value;
}

function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  if (!value) {
    return defaultValue!;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new Error(
      `Invalid environment variable ${key}: expected a number, got "${value}"`
    );
  }
  
  return parsed;
}

function getEnvVarAsBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  
  if (!value) {
    return defaultValue;
  }
  
  return value.toLowerCase() === 'true' || value === '1';
}

export const env = {
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  
  // Node Environment
  NODE_ENV: getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  
  // Database Pool Configuration
  DB_POOL_MAX: getEnvVarAsNumber('DB_POOL_MAX', 20),
  DB_POOL_MIN: getEnvVarAsNumber('DB_POOL_MIN', 2),
  DB_POOL_IDLE_TIMEOUT: getEnvVarAsNumber('DB_POOL_IDLE_TIMEOUT', 30000),
  DB_POOL_CONNECTION_TIMEOUT: getEnvVarAsNumber('DB_POOL_CONNECTION_TIMEOUT', 5000), // Reduced to 5 seconds
  
  // Application
  APP_ENV: getEnvVar('APP_ENV', 'development'),
  IS_PRODUCTION: getEnvVarAsBoolean('NODE_ENV', false) || process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// Validate critical environment variables at module load
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required but not set');
}

