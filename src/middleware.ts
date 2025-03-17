import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import LRUCache from 'lru-cache';
import { addSecurityHeaders } from './utils/security';

// Rate limiting implementation (inlined to avoid module resolution issues)
type RateLimitOptions = {
  interval: number;
  uniqueTokenPerInterval: number;
}

function createRateLimiter(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
        } else {
          tokenCount[0] = tokenCount[0] + 1;
          tokenCache.set(token, tokenCount);
        }
        
        if (tokenCount[0] > limit) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}

// Public paths that don't require authentication
const publicPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/[...nextauth]",
  "/api/webhooks"
];

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://final-fantasy-app.vercel.app',
  // Add your production domains here
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Handle CORS
  const origin = request.headers.get('origin');
  const response = NextResponse.next();
  
  // Add security headers to all responses
  addSecurityHeaders(response);
  
  // Add CORS headers if origin is allowed or in development
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response;
  }
  
  // Skip middleware for non-API routes and public paths
  if (!path.startsWith('/api') || 
      publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return response;
  }
  
  // Apply rate limiting to all API routes
  const limiter = createRateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
  });
  
  // Get client IP from headers (or forwarded headers in production)
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded ? 
    forwarded.split(',')[0].trim() : 
    request.headers.get('x-real-ip') || 'anonymous';
  
  try {
    await limiter.check(5, clientIp); // 5 requests per minute per IP
  } catch (error) {
    const errorResponse = NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
    
    // Add security headers to error response
    addSecurityHeaders(errorResponse);
    
    // Add CORS headers to error response
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    return errorResponse;
  }
  
  // Get the session token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // If no token and endpoint requires authentication
  if (!token) {
    const errorResponse = NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
    
    // Add security headers to error response
    addSecurityHeaders(errorResponse);
    
    // Add CORS headers to error response
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    return errorResponse;
  }
  
  // Role-based access control checks
  if (path.startsWith('/api/admin') && token.role !== 'MASTER_ADMIN') {
    const errorResponse = NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
    
    // Add security headers to error response
    addSecurityHeaders(errorResponse);
    
    // Add CORS headers to error response
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    return errorResponse;
  }
  
  if (path.startsWith('/api/referee') && 
      !['REFEREE', 'TOURNAMENT_ADMIN', 'MASTER_ADMIN'].includes(token.role as string)) {
    const errorResponse = NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
    
    // Add security headers to error response
    addSecurityHeaders(errorResponse);
    
    // Add CORS headers to error response
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    return errorResponse;
  }
  
  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/api/:path*',
  ],
}; 