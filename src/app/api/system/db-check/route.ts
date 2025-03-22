import { NextRequest, NextResponse } from "next/server";
import { pingDatabase, isDatabaseAvailable } from "@/lib/prisma";

/**
 * Database connection check API endpoint
 * Returns the current status of the database connection
 * Used by the login form to detect database connectivity issues
 */
export async function GET(req: NextRequest) {
  try {
    // Test database connection
    const isConnected = await pingDatabase();
    
    return NextResponse.json(
      { 
        connected: isConnected, 
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database check failed:", error);
    
    // Return appropriate error response
    return NextResponse.json(
      { 
        connected: false,
        error: error instanceof Error ? error.message : "Unknown database error",
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Still return 200 so the frontend can handle the error
    );
  }
} 