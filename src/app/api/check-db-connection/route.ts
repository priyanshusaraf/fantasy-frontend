import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { pingDatabase, isDatabaseAvailable } from '@/lib/prisma';

// Keep a history of recent connection statuses
const connectionHistory: Array<{ timestamp: number; connected: boolean; error?: string }> = [];
const MAX_HISTORY = 10;

// Add a record to connection history
function recordConnectionStatus(connected: boolean, error?: string) {
  const timestamp = Date.now();
  connectionHistory.unshift({ timestamp, connected, error });
  
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
      setTimeout(() => reject(new Error('Database query timed out after 5 seconds')), 5000);
    });
    
    // Use Promise.race to implement timeout for the query
    let connected = false;
    let queryLatency = 0;
    let error = null;
    
    try {
      // First check if the database is already known to be connected
      const cachedStatus = isDatabaseAvailable();
      
      // If not cached or false, actually ping the database
      if (!cachedStatus) {
        console.log('No positive cached connection status, pinging database');
        await Promise.race([pingDatabase(), timeoutPromise]);
      } else {
        console.log('Using cached database connection status');
      }
      
      // Try running a test query
      const queryStartTime = Date.now();
      
      // Always try running a simple query to verify connectivity
      await Promise.race([
        prisma.$queryRaw`SELECT 1 as connected`,
        timeoutPromise
      ]);
      
      queryLatency = Date.now() - queryStartTime;
      connected = true;
    } catch (err: any) {
      console.error('Database connection check failed:', err);
      error = err.message || 'Unknown database error';
      connected = false;
    }
    
    // Record this connection status
    const timestamp = recordConnectionStatus(connected, error || undefined);
    
    // Calculate total latency
    const totalLatency = Date.now() - startTime;
    
    // Return detailed response
    return NextResponse.json({
      success: true,
      connected,
      timestamp,
      timestampISO: new Date(timestamp).toISOString(),
      latency: {
        total: totalLatency,
        query: queryLatency
      },
      history: connectionHistory,
      error: error,
      environment: process.env.NODE_ENV || 'unknown',
      cached: isDatabaseAvailable(),
    });
  } catch (error: any) {
    console.error('Error in database connection check API:', error);
    
    // Record this failed connection
    const timestamp = recordConnectionStatus(false, error.message || 'Unknown error');
    
    return NextResponse.json({
      success: false,
      connected: false,
      timestamp,
      timestampISO: new Date(timestamp).toISOString(),
      error: error.message || 'Unknown error occurred while checking database connection',
      history: connectionHistory,
      environment: process.env.NODE_ENV || 'unknown',
    }, { status: 503 });
  }
} 