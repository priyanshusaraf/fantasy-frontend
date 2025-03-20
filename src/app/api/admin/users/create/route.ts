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

    // Create the user with hashed password directly in User model
    const newUser = await prisma.user.create({
      data: {
        username,
        name: username, // Use username as the initial name
        email,
        role,
        password: hashedPassword, // Store the hashed password in the User model
        status: "ACTIVE",
      },
    });

    // Create credentials account
    await prisma.account.create({
      data: {
        userId: newUser.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: email,
      }
    });

    // If it's a player, create the player profile
    if (role === "PLAYER" && skillLevel) {
      await prisma.player.create({
        data: {
          userId: newUser.id,
          name: username,
          skillLevel: skillLevel as any, // Cast to any since skillLevel is an enum
        },
      });
    }

    // Create corresponding role-specific record if needed
    if (role === "REFEREE") {
      await prisma.referee.create({
        data: {
          userId: newUser.id,
          certificationLevel: "BASIC", // Default certification level
        },
      });
    } else if (role === "TOURNAMENT_ADMIN") {
      await prisma.tournamentAdmin.create({
        data: {
          userId: newUser.id,
        },
      });
    } else if (role === "MASTER_ADMIN") {
      await prisma.masterAdmin.create({
        data: {
          userId: newUser.id,
        },
      });
    }

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
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
} 