import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

// This should match your .env variable
const ADMIN_KEY = process.env.ADMIN_KEY || "matchup-admin-secret-key";

const LinkAccountSchema = z.object({
  email: z.string().email(),
  adminKey: z.string(),
  googleId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = LinkAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }
    
    const { email, adminKey, googleId, accessToken, refreshToken } = result.data;
    
    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { message: "Invalid admin key" },
        { status: 403 }
      );
    }
    
    // Check if user with email exists
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if account already exists and delete it if it does
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "google",
      },
    });
    
    if (existingAccount) {
      await prisma.account.delete({
        where: {
          id: existingAccount.id,
        },
      });
    }
    
    // Create the OAuth account
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: googleId,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        id_token: null,
        token_type: "Bearer",
        scope: "openid profile email",
        session_state: null,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      },
    });
    
    return NextResponse.json({
      message: "Google account linked successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error linking Google account:", error);
    return NextResponse.json(
      { message: "Failed to link Google account" },
      { status: 500 }
    );
  }
} 