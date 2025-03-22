import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Authentication middleware for role-based access
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip authentication for public paths and auth-related paths
  const publicPaths = [
    '/',
    '/auth',
    '/auth/register',
    '/api/auth',
    '/api/health',
    '/api/check-db-connection',
    '/favicon.ico'
  ];
  
  // Skip middleware for public paths or static files
  if (
    publicPaths.some(path => pathname.startsWith(path)) ||
    pathname.includes('/_next/') ||
    pathname.includes('/images/') || 
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // Get the token - simplified to prevent connection errors
  const token = await getToken({ 
    req: request,
    secureCookie: process.env.NODE_ENV === 'production'
  });

  // If no token, redirect to login page
  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Get the user role from token
  const role = (token.role as string || 'USER').toUpperCase();

  // Check access to restricted areas
  if (pathname.startsWith('/admin') && 
      !['ADMIN', 'MASTER_ADMIN', 'TOURNAMENT_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (pathname.startsWith('/player') && role !== 'PLAYER') {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (pathname.startsWith('/referee') && role !== 'REFEREE') {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Redirect to appropriate dashboard based on role
  if (pathname === '/dashboard') {
    let redirectPath = '/user/dashboard';
    
    if (['ADMIN', 'MASTER_ADMIN', 'TOURNAMENT_ADMIN'].includes(role)) {
      redirectPath = '/admin/dashboard';
    } else if (role === 'PLAYER') {
      redirectPath = '/player/dashboard';
    } else if (role === 'REFEREE') {
      redirectPath = '/referee/dashboard';
    }
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on - key change to fix authentication
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - api/auth (NextAuth internals)
     * - static files, images, and other assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

