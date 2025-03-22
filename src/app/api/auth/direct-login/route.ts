import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * Direct Login API
 * 
 * This endpoint provides emergency access for admins when the database is down.
 * It validates credentials against environment variables and generates a JWT token.
 */
export async function POST(req: NextRequest) {
  // Only available in development or with special flag
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_EMERGENCY_LOGIN !== 'true') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 404 }
    );
  }
  
  try {
    const data = await req.json();
    const { email, password } = data;
    
    // Validate credentials against environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured' },
        { status: 500 }
      );
    }
    
    if (
      email?.toLowerCase() !== adminEmail.toLowerCase() ||
      password !== adminPassword
    ) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = sign(
      {
        sub: 'admin-master',
        email: adminEmail,
        name: 'System Admin',
        role: 'MASTER_ADMIN',
        isAdmin: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-production'
    );
    
    // Set session token in the response
    const response = NextResponse.json({
      success: true,
      message: 'Direct admin login successful',
      redirectTo: '/admin/dashboard',
    });
    
    // Set the cookie properly
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Direct login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 