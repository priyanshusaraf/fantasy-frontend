import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Database test route called");
    console.log("Database URL:", process.env.DATABASE_URL?.replace(/:[^:]*@/, ":****@"));
    
    // Try to connect to the database
    await prisma.$connect();
    console.log("Database connection successful");
    
    // Test a simple query
    const usersCount = await prisma.user.count();
    console.log(`Found ${usersCount} users in database`);
    
    return NextResponse.json({ 
      status: "success",
      message: "Database connection successful",
      usersCount 
    });
  } catch (error) {
    console.error("Database connection error:", error);
    
    // Create detailed error message
    let errorMessage = "Unknown error";
    let errorType = "Unknown";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.name;
      
      // Check for specific connection errors
      if (errorMessage.includes("ECONNREFUSED")) {
        errorType = "CONNECTION_REFUSED";
      } else if (errorMessage.includes("getaddrinfo")) {
        errorType = "DNS_RESOLUTION_FAILED";
      } else if (errorMessage.includes("Access denied")) {
        errorType = "ACCESS_DENIED";
      } else if (errorMessage.includes("timeout")) {
        errorType = "CONNECTION_TIMEOUT";
      }
    }
    
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: errorMessage,
      type: errorType
    }, { status: 500 });
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
} 