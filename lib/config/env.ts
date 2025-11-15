/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present at startup
 */

// Check if we're in build phase (Next.js build or Vercel build without DATABASE_URL)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-development-build' ||
                    (process.env.VERCEL === '1' && !process.env.DATABASE_URL);

function getEnvVar(key: string, defaultValue?: string, required: boolean = true): string {
  const value = process.env[key] || defaultValue;
  
  // Skip validation during build time - will be validated at runtime when database is accessed
  if (!value && required && !isBuildTime) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please check your .env.local file or environment configuration.`
    );
  }
  
  // Return empty string during build if not set (will be validated at runtime)
  return value || '';
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
  // Allow DATABASE_URL to be empty during build, validate at runtime when database pool is created
  DATABASE_URL: getEnvVar('DATABASE_URL', undefined, !isBuildTime),
  
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

// Note: DATABASE_URL validation is deferred to runtime when the database pool is created
// This allows the build to succeed even if DATABASE_URL is not set during build time

