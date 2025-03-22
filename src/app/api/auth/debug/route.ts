import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    
    // Test session
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      status: 'success',
      database: { connected: true, userCount },
      session: session ? { active: true, role: session?.user?.role } : { active: false },
      env: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL ? 'set' : 'missing',
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing',
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
    }, { status: 500 });
  }
} 