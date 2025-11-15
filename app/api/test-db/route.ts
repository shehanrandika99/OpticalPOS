/**
 * Database connection test API endpoint
 * Production-ready with proper error handling and security
 */

import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import type { DatabaseConnectionResult } from '@/lib/types/database';

// Rate limiting could be added here using middleware
// For now, we'll keep it simple but production-ready

export async function GET() {
  try {
    const result: DatabaseConnectionResult = await testConnection();
    
    if (result.success) {
      logger.info('Database test endpoint: Success', {
        timestamp: result.timestamp,
      });
      
      return NextResponse.json(
        {
          success: true,
          message: 'Database connected successfully!',
          timestamp: result.timestamp,
        },
        { status: 200 }
      );
    } else {
      // Log error but don't expose sensitive details to client
      logger.error('Database test endpoint: Failed', undefined, {
        errorCode: result.errorCode,
      });
      
      // In production, don't expose detailed error messages
      const isProduction = process.env.NODE_ENV === 'production';
      const errorMessage = isProduction
        ? 'Database connection failed. Please contact support.'
        : result.error;
      
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          ...(isProduction ? {} : { error: errorMessage, errorCode: result.errorCode }),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Database test endpoint: Unexpected error', error);
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to database',
        ...(isProduction
          ? {}
          : { error: error instanceof Error ? error.message : 'Unknown error' }),
      },
      { status: 500 }
    );
  }
}
