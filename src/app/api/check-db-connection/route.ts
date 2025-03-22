import { NextResponse } from 'next/server';
import prisma, { checkDatabaseConnection, isUsingFallbackDatabase } from '@/lib/db';

// Keep a history of recent connection statuses
const connectionHistory: Array<{ 
  timestamp: number; 
  connected: boolean; 
  usingFallback: boolean;
  error?: string;
}> = [];
const MAX_HISTORY = 10;

// Add a record to connection history
function recordConnectionStatus(connected: boolean, usingFallback: boolean, error?: string) {
  const timestamp = Date.now();
  connectionHistory.unshift({ timestamp, connected, usingFallback, error });
  
  // Trim history to keep only the latest entries
  if (connectionHistory.length > MAX_HISTORY) {
    connectionHistory.length = MAX_HISTORY;
  }
  
  return timestamp;
}

export async function GET() {
  // Track start time for latency measurement
  const startTime = Date.now();
  
  try {
    // Set a timeout for the database query
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out after 3 seconds')), 3000);
    });
    
    // Use Promise.race to implement timeout for the query
    let connected = false;
    let queryLatency = 0;
    let error = null;
    
    try {
      // Check database connection with built-in retry logic
      console.log('Checking database connection...');
      const queryStartTime = Date.now();
      
      // Use our enhanced connection check with retry logic
      connected = await Promise.race([
        checkDatabaseConnection(),
        timeoutPromise
      ]);
      
      queryLatency = Date.now() - queryStartTime;
      
      if (!connected) {
        error = 'Database connection failed after multiple attempts';
      }
    } catch (err: any) {
      console.error('Database connection check failed:', err);
      error = err.message || 'Unknown database error';
      connected = false;
    }
    
    // Get fallback status
    const usingFallback = isUsingFallbackDatabase();
    
    // Record this connection status
    const timestamp = recordConnectionStatus(connected, usingFallback, error || undefined);
    
    // Calculate total latency
    const totalLatency = Date.now() - startTime;
    
    // Return detailed response
    return NextResponse.json({
      success: true,
      connected,
      usingFallback,
      fallbackAvailable: process.env.ENABLE_DB_FALLBACK === 'true',
      timestamp,
      timestampISO: new Date(timestamp).toISOString(),
      latency: {
        total: totalLatency,
        query: queryLatency
      },
      history: connectionHistory,
      error: error,
      environment: process.env.NODE_ENV || 'unknown',
    });
  } catch (error: any) {
    console.error('Error in database connection check API:', error);
    
    // Record this failed connection
    const timestamp = recordConnectionStatus(false, false, error.message || 'Unknown error');
    
    return NextResponse.json({
      success: false,
      connected: false,
      usingFallback: false,
      fallbackAvailable: process.env.ENABLE_DB_FALLBACK === 'true',
      timestamp,
      timestampISO: new Date(timestamp).toISOString(),
      error: error.message || 'Unknown error occurred while checking database connection',
      history: connectionHistory,
      environment: process.env.NODE_ENV || 'unknown',
    }, { status: 503 });
  }
} 