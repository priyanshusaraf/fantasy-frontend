import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token and check authorization
    const token = await getToken({ req: request });

    if (!token || token.role !== "MASTER_ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Get user ID from params
    const userId = params.id;

    // Get role from request body
    const { role } = await request.json();

    // Validate role
    const validRoles = [
      "USER",
      "PLAYER",
      "REFEREE",
      "TOURNAMENT_ADMIN",
      "MASTER_ADMIN",
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    // For specific roles, create or update related records
    if (role === "TOURNAMENT_ADMIN") {
      await prisma.tournamentAdmin.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    } else if (role === "REFEREE") {
      await prisma.referee.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          certificationLevel: "Standard",
        },
      });
    } else if (role === "PLAYER") {
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

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
