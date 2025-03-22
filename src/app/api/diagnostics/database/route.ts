import { NextResponse } from 'next/server';
import { getDatabaseStatus } from '@/lib/db';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get current connection status
    const status = getDatabaseStatus();
    
    // Try to execute a simple test query
    let testQuerySuccess = false;
    let responseTime = 0;
    let errorMessage = '';
    
    try {
      const startTime = Date.now();
      const result = await prisma.$queryRaw`SELECT 1 as result`;
      responseTime = Date.now() - startTime;
      testQuerySuccess = Array.isArray(result) && result.length > 0;
    } catch (error: any) {
      errorMessage = error.message || 'Unknown error during test query';
    }
    
    // Gather additional information
    const diagnosticInfo = {
      status,
      testQuery: {
        success: testQuerySuccess,
        responseTime: `${responseTime}ms`,
        error: errorMessage || null
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.replace(/\/\/([^:]+):[^@]+@/, '//****:****@') :
          null,
        fallbackEnabled: process.env.ENABLE_DB_FALLBACK === 'true'
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(diagnosticInfo, { status: testQuerySuccess ? 200 : 503 });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Database diagnostic failed', 
        message: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 