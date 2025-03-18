import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

// This should match your .env variable
const ADMIN_KEY = process.env.ADMIN_KEY || "matchup-admin-secret-key";

const MasterAdminSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  adminKey: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = MasterAdminSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.errors },
        { status: 400 }
      );
    }
    
    const { email, username, adminKey } = result.data;
    
    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { message: "Invalid admin key" },
        { status: 403 }
      );
    }
    
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      // If user exists but is not MASTER_ADMIN, update them
      if (existingUser.role !== "MASTER_ADMIN") {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "MASTER_ADMIN",
            isApproved: true,
            isVerified: true,
            username: username,
          },
        });
        
        // Create master admin record if it doesn't exist
        const existingMasterAdmin = await prisma.masterAdmin.findUnique({
          where: { userId: updatedUser.id },
        });
        
        if (!existingMasterAdmin) {
          await prisma.masterAdmin.create({
            data: {
              userId: updatedUser.id,
            },
          });
        }
        
        return NextResponse.json({
          message: "User upgraded to MASTER_ADMIN successfully",
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            role: updatedUser.role,
          },
        });
      }
      
      return NextResponse.json({
        message: "User is already a MASTER_ADMIN",
        user: {
          id: existingUser.id,
          email: existingUser.email,
          username: existingUser.username,
          role: existingUser.role,
        }
      });
    }
    
    // Create new user with MASTER_ADMIN role
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        name: username, // Added name field for Google OAuth compatibility
        role: "MASTER_ADMIN",
        isApproved: true,
        isVerified: true,
      },
    });
    
    // Create master admin record
    await prisma.masterAdmin.create({
      data: {
        userId: newUser.id,
      },
    });
    
    // Create wallet
    await prisma.wallet.create({
      data: {
        userId: newUser.id,
        balance: 0,
      },
    });
    
    return NextResponse.json({
      message: "MASTER_ADMIN created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error creating MASTER_ADMIN:", error);
    return NextResponse.json(
      { message: "Failed to create MASTER_ADMIN" },
      { status: 500 }
    );
  }
} 