import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Don't expose actual values, just status
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    return NextResponse.json({
      status: 'success',
      adminEmailConfigured: !!adminEmail,
      adminEmailLength: adminEmail?.length || 0,
      adminPasswordConfigured: !!adminPassword,
      adminPasswordLength: adminPassword?.length || 0,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 