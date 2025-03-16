import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authorization check
    const token = await getToken({ req: request });
    if (!token || token.role !== "MASTER_ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Convert params.id to number, if your schema is using Int
    const userId = parseInt(params.id, 10);

    // Get role from request body
    const { role } = await request.json();

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
        profileImage: true, // <--- fix here
      },
    });

    // Upsert the role-based record if needed
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
      const user = await prisma.user.findUnique({ where: { id: userId } });
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

    // Return the object to the client
    // If you want to rename `profileImage` → `image` in the response:
    const finalUser = {
      ...updatedUser,
      image: updatedUser.profileImage,
    };
    // Remove `profileImage` so front-end only sees `image`
    delete (finalUser as any).profileImage;

    return NextResponse.json(finalUser, { status: 200 });
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
