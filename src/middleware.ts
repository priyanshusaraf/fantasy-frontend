import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { LRUCache } from 'lru-cache';
import { addSecurityHeaders } from './utils/security';
import { env } from '@/lib/env';

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
  "/api/auth",
  "/api/auth/register",
  "/auth",
  "/api/webhooks",
  "/api/test-db"
];

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://final-fantasy-app.vercel.app',
  'https://matchup.ltd',
];

// Add NEXTAUTH_URL to allowed origins if it exists and is not already included
if (process.env.NEXTAUTH_URL && !allowedOrigins.includes(process.env.NEXTAUTH_URL)) {
  allowedOrigins.push(process.env.NEXTAUTH_URL);
}

// Explicitly add matchup.ltd domain if not included
if (!allowedOrigins.includes('https://matchup.ltd')) {
  allowedOrigins.push('https://matchup.ltd');
}

export async function middleware(request: NextRequest) {
  // Block Sentry API requests that are causing errors
  if (request.url.includes('ingest.sentry.io')) {
    return new NextResponse(null, { status: 200 });
  }
  
  const path = request.nextUrl.pathname;
  
  // Handle CORS
  const origin = request.headers.get('origin');
  const response = NextResponse.next();
  
  // Add security headers to all responses
  addSecurityHeaders(response);
  
  // Add CORS headers if origin is allowed or in development
  if (origin && (allowedOrigins.includes(origin) || env.NODE_ENV === 'development')) {
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
      publicPaths.some(publicPath => path.startsWith(publicPath) || path === publicPath)) {
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
    if (origin && (allowedOrigins.includes(origin) || env.NODE_ENV === 'development')) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    return errorResponse;
  }
  
  // Get the session token
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  
  // If no token and endpoint requires authentication
  if (!token) {
    const errorResponse = NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
    
    // Add security headers to error response
    addSecurityHeaders(errorResponse);
    
    // Add CORS headers to error response
    if (origin && (allowedOrigins.includes(origin) || env.NODE_ENV === 'development')) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    return errorResponse;
  }
  
  // Role-based access control checks
  if (path.startsWith('/api/admin') && 
      !['MASTER_ADMIN', 'TOURNAMENT_ADMIN'].includes(token.role as string)) {
    const errorResponse = NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
    
    // Add security headers to error response
    addSecurityHeaders(errorResponse);
    
    // Add CORS headers to error response
    if (origin && (allowedOrigins.includes(origin) || env.NODE_ENV === 'development')) {
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
    if (origin && (allowedOrigins.includes(origin) || env.NODE_ENV === 'development')) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    return errorResponse;
  }
  
  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/api/((?!auth/register|auth/callback|auth|webhooks|test-db).*)',
  ],
}; 