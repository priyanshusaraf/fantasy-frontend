import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { diagnoseConnectionIssue, isUsingFallbackDatabase } from '@/lib/db';
import { initSqliteFallback, testSqliteConnection } from '@/lib/sqlite-fallback';

/**
 * Debug Database API
 * 
 * This API provides detailed diagnostics for database connectivity issues.
 * It should only be enabled in development mode.
 */
export async function GET() {
  // Security check - only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      success: false,
      error: 'This endpoint is only available in development mode',
    }, { status: 403 });
  }
  
  try {
    const cwd = process.cwd();
    const dataDir = path.join(cwd, 'data');
    const sqlitePath = path.join(dataDir, 'fallback.sqlite');
    
    // Check directory permissions and structure
    const dirInfo = {
      cwd,
      dataDir: {
        exists: fs.existsSync(dataDir),
        isDirectory: fs.existsSync(dataDir) ? fs.statSync(dataDir).isDirectory() : false,
        // Check if writable without using accessSync which returns void
        writable: (() => {
          try {
            fs.accessSync(dataDir, fs.constants.W_OK);
            return true;
          } catch {
            return false;
          }
        })(),
      },
      sqliteDb: {
        exists: fs.existsSync(sqlitePath),
        isFile: fs.existsSync(sqlitePath) ? fs.statSync(sqlitePath).isFile() : false,
        size: fs.existsSync(sqlitePath) ? fs.statSync(sqlitePath).size : 0,
      }
    };
    
    // Test SQLite connection directly
    let sqliteStatus = false;
    try {
      sqliteStatus = testSqliteConnection();
    } catch (error) {
      console.error('Error testing SQLite connection:', error);
    }
    
    // Try to initialize SQLite
    let sqliteInit = false;
    try {
      sqliteInit = initSqliteFallback();
    } catch (error) {
      console.error('Error initializing SQLite:', error);
    }
    
    // Check database connection status
    const dbDiagnostic = await diagnoseConnectionIssue();
    
    // Gather env info
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      ENABLE_DB_FALLBACK: process.env.ENABLE_DB_FALLBACK,
      DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : undefined, // Don't expose full URL
      FALLBACK_DATABASE_URL: process.env.FALLBACK_DATABASE_URL,
      usingFallback: isUsingFallbackDatabase(),
    };
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envInfo,
      directories: dirInfo,
      database: {
        diagnostic: dbDiagnostic,
        usingFallback: isUsingFallbackDatabase(),
        sqlite: {
          tested: sqliteStatus,
          initialized: sqliteInit
        }
      }
    });
  } catch (error) {
    console.error('Error in database debug API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
} 