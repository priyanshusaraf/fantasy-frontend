import NextAuth from "next-auth";
import authOptions from "@/lib/auth/config";
import { NextRequest, NextResponse } from "next/server";
import { pingDatabase } from "@/lib/prisma";

// Enhanced handler with error protection
async function handleAuthRequest(req: NextRequest, context: any) {
  try {
    // Check database connection before proceeding
    const dbAvailable = await pingDatabase().catch(() => false);
    
    if (!dbAvailable) {
      console.warn("Database unavailable during auth request");
    }
    
    // Add custom headers for debugging
    const headers = new Headers();
    headers.set("X-Auth-Database-Available", dbAvailable ? "true" : "false");
    
    // Process auth request with error timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Auth request timed out")), 10000)
    );
    
    const authPromise = NextAuth(authOptions)(req, context);
    
    // Await with timeout to prevent hanging
    const result = await Promise.race([authPromise, timeoutPromise]);
    
    // Add custom headers to response if it's a NextResponse
    if (result instanceof NextResponse) {
      for (const [key, value] of headers.entries()) {
        result.headers.set(key, value);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Auth handler error:", error);
    
    // Create a graceful error response
    return new NextResponse(JSON.stringify({
      error: "Authentication service temporarily unavailable",
      retryAfter: 10
    }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "10"
      }
    });
  }
}

export async function GET(request: NextRequest, context: any) {
  return handleAuthRequest(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return handleAuthRequest(request, context);
}

export { authOptions };
