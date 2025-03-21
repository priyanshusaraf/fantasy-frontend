import { NextRequest, NextResponse } from "next/server";
import { pingDatabase, diagnoseConnectionIssue, isDatabaseAvailable } from "@/lib/prisma";
import prisma from "@/lib/prisma";

/**
 * Health check API endpoint
 * Allows checking the status of the database connection
 * This is useful for debugging connection issues with AWS RDS
 */
export async function GET(req: NextRequest) {
  try {
    // Test database connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    // If query succeeds, database is connected
    return NextResponse.json(
      { 
        status: "healthy", 
        database: "connected",
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    
    // If query fails, database is disconnected
    return NextResponse.json(
      { 
        status: "unhealthy", 
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
} 