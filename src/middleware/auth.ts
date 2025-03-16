import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Array of paths that don't require authentication
export const publicPaths = ["/login", "/register", "/reset-password", "/"];

// Array of paths that require authentication explicitly (overrides other checks)
export const protectedPaths = [
  "/api/tournaments/",
  "/api/fantasy-pickleball/",
  "/api/admin/",
  "/admin/"
];

export async function authMiddleware(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname } = url;
  console.log(`Middleware checking auth for path: ${pathname}`);
  
  // Special handling for read-only contest endpoints in development mode
  const isContestsReadEndpoint = pathname.includes("/api/tournaments/") && 
                               pathname.includes("/contests") && 
                               request.method === "GET";
                               
  if (process.env.NODE_ENV !== 'production' && isContestsReadEndpoint) {
    console.log("⚠️ DEVELOPMENT MODE: Bypassing auth for read-only contests endpoint");
    return NextResponse.next();
  }
  
  // Check for specific sensitive paths that must always be protected
  const isExplicitlyProtected = protectedPaths.some(path => pathname.includes(path));
  
  // Check for specific sensitive operations that must always be protected
  const isSensitiveOperation = pathname.includes("fantasy-setup") || 
                              (pathname.includes("contests") && request.method !== "GET") ||
                              pathname.includes("create") ||
                              pathname.includes("update") ||
                              pathname.includes("delete");
  
  // Check if the path is in the public paths list
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  if (isPublicPath && !isExplicitlyProtected && !isSensitiveOperation) {
    console.log(`Path ${pathname} is public, skipping auth check`);
    return NextResponse.next();
  }
  
  // Get token from Authorization header
  const authHeader = request.headers.get("authorization");
  console.log(`Authorization header: ${authHeader ? "Present" : "Missing"}`);
  
  // If no authorization header, check session cookie as fallback
  // This is useful for browser-based requests where header isn't set
  if (!authHeader) {
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      console.log(`No auth token found for API route ${pathname}`);
      return NextResponse.json({ message: "Unauthorized - No valid authentication token" }, { status: 401 });
    }
    
    // For other routes, redirect to login
    console.log(`No auth token found for ${pathname}, redirecting to login`);
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  try {
    const token = authHeader.replace("Bearer ", "");
    console.log("Attempting to verify token...");
    
    // DEVELOPMENT ONLY: Bypass token verification for development token
    // This should be removed in production
    if (process.env.NODE_ENV !== 'production') {
      if (token === 'fake_development_token_for_testing') {
        console.log("⚠️ DEVELOPMENT MODE: Using fake development token");
        // Create a fake payload for development
        const devPayload = {
          id: 1,
          email: 'dev@example.com',
          role: 'MASTER_ADMIN',
          name: 'Development User'
        };
        
        // Add dev user to request
        (request as any).user = devPayload;
        
        return NextResponse.next();
      }
    }
    
    // Normal token verification for real tokens
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'development_fallback_secret');
    
    try {
      const { payload } = await jwtVerify(token, secret);
      console.log(`Token verified successfully for user ID: ${payload.id}`);
      
      // Add user to request
      (request as any).user = payload;
      
      return NextResponse.next();
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      
      // In development mode, allow certain paths even with invalid tokens
      if (process.env.NODE_ENV !== 'production') {
        // For non-sensitive read operations in development, proceed anyway
        if (request.method === "GET" && !isSensitiveOperation) {
          console.log("⚠️ DEVELOPMENT MODE: Allowing GET request despite invalid token");
          // Create a fake payload for development
          const devPayload = {
            id: 1,
            email: 'dev@example.com',
            role: 'MASTER_ADMIN',
            name: 'Development User'
          };
          
          // Add dev user to request
          (request as any).user = devPayload;
          
          return NextResponse.next();
        }
      }
      
      throw verifyError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: "Unauthorized - Invalid token" }, { status: 401 });
    }
    
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
