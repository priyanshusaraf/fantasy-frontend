import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from '@/env.mjs';

// Security headers to add to all responses
function addSecurityHeaders(response: NextResponse) {
  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

// Define response helpers for auth errors
function handleAuthError(message: string, status = 500) {
  const response = new NextResponse(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  addSecurityHeaders(response);
  return response;
}

// Rate limiter implementation
class RateLimiter {
  private readonly tokenBuckets: Map<string, { tokens: number; lastRefill: number }>;
  private readonly interval: number;

  constructor(options: { interval: number; uniqueTokenPerInterval: number }) {
    this.tokenBuckets = new Map();
    this.interval = options.interval;
  }

  async check(limit: number, key: string): Promise<void> {
    const now = Date.now();
    let bucket = this.tokenBuckets.get(key);

    if (!bucket) {
      bucket = { tokens: limit, lastRefill: now };
      this.tokenBuckets.set(key, bucket);
      return;
    }

    // Refill tokens based on elapsed time
    const elapsedTime = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsedTime / this.interval) * limit;
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    if (bucket.tokens <= 0) {
      throw new Error('Rate limit exceeded');
    }

    bucket.tokens -= 1;
  }
}

// Function to create a new rate limiter
function createRateLimiter(options: { interval: number; uniqueTokenPerInterval: number }) {
  return new RateLimiter(options);
}

// Define paths that don't require auth
const publicPaths = [
  '/api/auth',
  '/api/tournaments',
  '/api/players',
  '/api/leaderboard',
  '/api/test',
  '/api/test-db',
];

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://finally-frontend.vercel.app', 
];

// Add production domain to allowed origins
if (env.NEXT_PUBLIC_APP_URL) {
  allowedOrigins.push(env.NEXT_PUBLIC_APP_URL);
  allowedOrigins.push('https://matchup.ltd');
}

export async function middleware(request: NextRequest) {
  // Block Sentry API requests that are causing errors
  if (request.url.includes('ingest.sentry.io')) {
    return new NextResponse(null, { status: 200 });
  }
  
  const path = request.nextUrl.pathname;
  
  // Special handling for auth API routes to better handle database errors
  if (path.startsWith('/api/auth/')) {
    const origin = request.headers.get('origin');
    
    // Add more robust timeout handling for auth routes
    if (path === '/api/auth/register' || path === '/api/auth/callback/credentials') {
      const response = NextResponse.next();
      
      // Add security headers
      addSecurityHeaders(response);
      
      // Add CORS headers
      if (origin && (allowedOrigins.includes(origin) || env.NODE_ENV === 'development')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');
      }
      
      return response;
    }
  }
  
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