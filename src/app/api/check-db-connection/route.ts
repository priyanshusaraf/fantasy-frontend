import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";  // Ensure this import matches your project structure

export async function GET() {
  try {
    // Try a simple database query to check connection
    await prisma.$queryRaw`SELECT 1`;
    
    // If we get here, the connection is good
    return NextResponse.json({ 
      success: true, 
      connected: true, 
      message: "Database connection successful"
    });
  } catch (error) {
    console.error("Database connection check failed:", error);
    
    // Return a 200 response but indicate the connection failed
    return NextResponse.json({ 
      success: false, 
      connected: false, 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 