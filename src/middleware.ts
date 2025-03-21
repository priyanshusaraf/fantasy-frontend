import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Don't apply middleware to these paths
  const publicPaths = [
    '/api/auth',
    '/auth',
    '/login',
    '/register',
    '/api/health',
    '/',
    '/maintenance',
  ];

  // Skip middleware for public paths or static files
  if (publicPaths.some(publicPath => path.startsWith(publicPath)) || 
      path.includes('/_next/') || 
      path.includes('/images/')) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Redirect unauthenticated users to login page
  if (!token) {
    const url = new URL('/auth', request.url);
    
    // Add a simple callbackUrl without the risk of nesting
    // This is the key change to prevent the redirect loop
    url.searchParams.set('callbackUrl', path);
    
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Apply to all paths except those starting with:
    '/((?!api/auth|auth|login|register|_next|images|favicon.ico).*)',
  ],
};
