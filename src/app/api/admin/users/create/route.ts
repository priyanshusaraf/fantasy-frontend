import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated and has admin privileges
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the user has admin privileges
    if (
      session.user?.role !== "MASTER_ADMIN" &&
      session.user?.role !== "TOURNAMENT_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to create users" },
        { status: 403 }
      );
    }

    // Parse request body
    const {
      username,
      email,
      role,
      skillLevel,
      password,
      autoApprove = true,
      sendEmail = true,
    } = await req.json();

    // Basic validation
    if (!username || !email || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findFirst({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 }
      );
    }

    // Special validation for PLAYER role
    if (role === "PLAYER" && !skillLevel) {
      return NextResponse.json(
        { error: "Skill level is required for player accounts" },
        { status: 400 }
      );
    }

    // Check if the current user can create a MASTER_ADMIN
    if (role === "MASTER_ADMIN" && session.user?.role !== "MASTER_ADMIN") {
      return NextResponse.json(
        { error: "Only MASTER_ADMIN users can create other MASTER_ADMIN accounts" },
        { status: 403 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction to ensure all records are created or none are
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the user with hashed password
      const user = await tx.user.create({
        data: {
          username,
          name: username, // Use username as the initial name
          email,
          role,
          password: hashedPassword,
          status: "ACTIVE",
        },
      });

      // Create credentials account
      await tx.account.create({
        data: {
          userId: user.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
        }
      });

      // Create role-specific record if needed
      if (role === "PLAYER" && skillLevel) {
        await tx.player.create({
          data: {
            userId: user.id,
            name: username,
            skillLevel: skillLevel as any, // Cast to any since skillLevel is an enum
            isActive: true,
          },
        });
      } else if (role === "REFEREE") {
        await tx.referee.create({
          data: {
            userId: user.id,
            certificationLevel: "BASIC", // Default certification level
          },
        });
      } else if (role === "TOURNAMENT_ADMIN") {
        await tx.tournamentAdmin.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === "MASTER_ADMIN") {
        await tx.masterAdmin.create({
          data: {
            userId: user.id,
          },
        });
      }

      // Initialize wallet for the user
      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      return user;
    });

    // Log successful creation
    console.log(`User ${newUser.id} (${newUser.email}) created successfully with role ${newUser.role}`);

    // TODO: If sendEmail is true, send an email notification to the user
    // with their credentials (this would be implemented in a separate service)
    if (sendEmail) {
      // Placeholder for email sending functionality
      console.log(`Email would be sent to ${email} with their credentials`);
    }

    // Return success response
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A conflict occurred with existing data", detail: error.meta?.target },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user", detail: error.message },
      { status: 500 }
    );
  }
} 