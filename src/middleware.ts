import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Middleware to handle authentication and role-based access
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip authentication for public paths
  const isPublicPath = 
    pathname === '/' || 
    pathname === '/auth' || 
    pathname.startsWith('/api/auth') ||
    pathname.includes('_next') || 
    pathname.includes('favicon.ico');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get auth token
  const token = await getToken({ req: request });
  
  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Handle role-based redirects for role-specific paths
  const role = (token.role as string || "USER").toUpperCase();

  // Admin paths can only be accessed by admins
  if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'MASTER_ADMIN' && role !== 'TOURNAMENT_ADMIN') {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Player paths can only be accessed by players
  if (pathname.startsWith('/player') && role !== 'PLAYER') {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Referee paths can only be accessed by referees
  if (pathname.startsWith('/referee') && role !== 'REFEREE') {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Ensure users go to the correct dashboard path
  if (pathname === '/dashboard') {
    if (role === 'ADMIN' || role === 'MASTER_ADMIN' || role === 'TOURNAMENT_ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } 
    else if (role === 'PLAYER') {
      return NextResponse.redirect(new URL('/player/dashboard', request.url));
    }
    else if (role === 'REFEREE') {
      return NextResponse.redirect(new URL('/referee/dashboard', request.url));
    }
    else {
      return NextResponse.redirect(new URL('/user/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Only apply middleware to these specific paths
    '/api/fantasy-pickleball/:path*',
    '/api/tournaments/:path*',
    '/api/matches/:path*',
    '/api/users/:path*', 
  ],
};

