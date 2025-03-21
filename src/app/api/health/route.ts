import { NextRequest, NextResponse } from "next/server";
import { pingDatabase, diagnoseConnectionIssue, isDatabaseAvailable } from "@/lib/prisma";

/**
 * Health check API endpoint
 * Allows checking the status of the database connection
 * This is useful for debugging connection issues with AWS RDS
 */
export async function GET(req: NextRequest) {
  try {
    // Check if this is a detailed check request
    const url = new URL(req.url);
    const detailed = url.searchParams.has('detailed');
    const secretKey = url.searchParams.get('key');
    
    // Basic information that's always safe to return
    const healthInfo = {
      status: "ok",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: {
        connected: isDatabaseAvailable(),
      }
    };
    
    // If detailed flag is set and admin key is provided, provide more detailed diagnostics
    // This should only be accessible in development or with a secret key
    if (detailed && (process.env.NODE_ENV === 'development' || secretKey === process.env.ADMIN_KEY)) {
      // Perform a new ping to check current status
      const dbStatus = await pingDatabase();
      
      // Get detailed diagnostics
      const diagnostics = await diagnoseConnectionIssue();
      
      return NextResponse.json({
        ...healthInfo,
        database: {
          ...healthInfo.database,
          connectionStatus: dbStatus ? "connected" : "disconnected",
          diagnostics,
          // Only include in development
          url: process.env.NODE_ENV === 'development' 
            ? process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@') // hide password
            : undefined
        }
      });
    }
    
    // Return basic health info
    return NextResponse.json(healthInfo);
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      { 
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 