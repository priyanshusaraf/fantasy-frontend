import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (
      session.user.role !== "MASTER_ADMIN" &&
      session.user.role !== "TOURNAMENT_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Only MASTER_ADMIN can set MASTER_ADMIN role
    const body = await request.json();
    if (body.role === "MASTER_ADMIN" && session.user.role !== "MASTER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Master Admins can create other Master Admins" },
        { status: 403 }
      );
    }

    // Get user ID from params
    const userId = params.id;

    // Validate role
    const validRoles = [
      "USER",
      "PLAYER",
      "REFEREE",
      "TOURNAMENT_ADMIN",
      "MASTER_ADMIN",
    ];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: body.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    // For specific roles, create or update related records
    if (body.role === "TOURNAMENT_ADMIN") {
      await prisma.tournamentAdmin.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    } else if (body.role === "REFEREE") {
      await prisma.referee.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          certificationLevel: "Standard",
        },
      });
    } else if (body.role === "PLAYER") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      await prisma.player.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          name: user?.name || "Unknown Player",
          isActive: true,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "User role updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
