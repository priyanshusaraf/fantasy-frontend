// src/app/api/auth/complete-registration/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    // Get the current session to verify the request
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    const { email, role, username, skillLevel } = await request.json();

    // Validate input
    if (!email || !username || !role) {
      return NextResponse.json(
        { message: "Email, username, and role are required" },
        { status: 400 }
      );
    }

    // Validate skill level for PLAYER role
    if (role === "PLAYER" && !skillLevel) {
      return NextResponse.json(
        { message: "Skill level is required for players" },
        { status: 400 }
      );
    }

    // Ensure the email matches the authenticated user
    if (email !== session.user.email) {
      return NextResponse.json(
        { message: "Unauthorized: Email mismatch" },
        { status: 401 }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername && existingUsername.email !== email) {
      return NextResponse.json(
        { message: "Username is already taken" },
        { status: 400 }
      );
    }

    // Update user with chosen role and username
    const user = await prisma.user.update({
      where: { email },
      data: {
        username,
        role,
        // Set appropriate status based on role - only TOURNAMENT_ADMIN needs approval
        status: role === "TOURNAMENT_ADMIN" ? "PENDING_APPROVAL" : "ACTIVE",
      },
    });

    // Create respective role-specific records
    if (role === "PLAYER") {
      // Check if player record already exists
      const existingPlayer = await prisma.player.findUnique({
        where: { userId: user.id },
      });

      if (!existingPlayer) {
        await prisma.player.create({
          data: {
            userId: user.id,
            name: user.name || username,
            isActive: true,
            skillLevel, // Store the player's skill level
          },
        });
      } else {
        // Update existing player with skill level
        await prisma.player.update({
          where: { userId: user.id },
          data: {
            skillLevel,
          },
        });
      }
    } else if (role === "REFEREE") {
      // Check if referee record already exists
      const existingReferee = await prisma.referee.findUnique({
        where: { userId: user.id },
      });

      if (!existingReferee) {
        await prisma.referee.create({
          data: {
            userId: user.id,
            certificationLevel: "Standard",
          },
        });
      }
    } else if (role === "TOURNAMENT_ADMIN") {
      // Check if tournament admin record already exists
      const existingAdmin = await prisma.tournamentAdmin.findUnique({
        where: { userId: user.id },
      });

      if (!existingAdmin) {
        await prisma.tournamentAdmin.create({
          data: {
            userId: user.id,
          },
        });
      }
    }

    // Check if wallet exists before creating
    const existingWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!existingWallet) {
      // Create a wallet for the user
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });
    }

    return NextResponse.json({
      message: "Registration completed successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Complete registration error:", error);
    return NextResponse.json(
      {
        message: "Failed to complete registration",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
