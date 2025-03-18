// src/app/api/auth/update-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const { role, username } = await request.json();

    // Validate inputs
    if (username && username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Check if role is valid
    if (role) {
      const validRoles = [
        "USER",
        "PLAYER",
        "REFEREE",
        "TOURNAMENT_ADMIN",
        "MASTER_ADMIN",
        "ORGANIZER",
      ];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role specified" },
          { status: 400 }
        );
      }
    }

    // Check if username is already taken (if username is provided)
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id.toString() !== session.user.id) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    // Determine if the user is automatically approved based on role
    const isApproved = !role || ["USER", "PLAYER"].includes(role);

    // Update user profile with only the fields that are provided
    const updateData: any = {};
    if (username) updateData.username = username;
    if (role) {
      updateData.role = role;
      updateData.isApproved = isApproved;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        username: updatedUser.username,
        isApproved: updatedUser.isApproved,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
