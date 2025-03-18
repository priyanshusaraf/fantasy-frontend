import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session to verify admin status
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    if (
      session.user.role !== "MASTER_ADMIN" &&
      session.user.role !== "TOURNAMENT_ADMIN"
    ) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Approve the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        isApproved: true
      }
    });

    // Return the updated user
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name || "Unnamed User",
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      image: updatedUser.profileImage
    });
  } catch (error) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { message: "Error approving user" },
      { status: 500 }
    );
  }
} 