import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

// This should match your .env variable
const ADMIN_KEY = process.env.ADMIN_KEY || "matchup-admin-secret-key";

const FixAdminAuthSchema = z.object({
  email: z.string().email(),
  adminKey: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = FixAdminAuthSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }
    
    const { email, adminKey } = result.data;
    
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
      include: {
        accounts: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // --- User Fixes ---
    // 1. Ensure user has all required fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.username || (user.email ? user.email.split("@")[0] : undefined),
        isVerified: true,
        // If the admin is not approved, approve them
        isApproved: true,
      }
    });
    
    // 2. Fix or create the master admin record if it doesn't exist
    if (user.role === "MASTER_ADMIN") {
      const masterAdmin = await prisma.masterAdmin.findUnique({
        where: { userId: user.id }
      });
      
      if (!masterAdmin) {
        await prisma.masterAdmin.create({
          data: { userId: user.id }
        });
      }
    }
    
    // 3. Fix wallet if it doesn't exist
    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.id }
    });
    
    if (!wallet) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      });
    }
    
    // --- Fix OAuth accounts ---
    
    // Remove any invalid Google accounts or placeholders
    for (const account of user.accounts) {
      if (account.provider === "google" && (
        account.providerAccountId.startsWith("placeholder_") ||
        !account.providerAccountId
      )) {
        await prisma.account.delete({
          where: { id: account.id }
        });
      }
    }
    
    // Check if user has Google account linked
    const hasGoogleAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "google",
      },
    });

    const needsGoogleAccount = !hasGoogleAccount && user.password === null;
    
    // NextAuth will handle linking on the next sign-in with our signIn callback
    
    return NextResponse.json({
      message: "Authentication fix applied successfully. You can now sign in with Google.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        needsOAuthLink: needsGoogleAccount
      },
    });
  } catch (error) {
    console.error("Error fixing admin authentication:", error);
    return NextResponse.json(
      { message: "Failed to fix admin authentication" },
      { status: 500 }
    );
  }
} 