import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    const { name, role } = data;

    // Validate role
    const validRoles = [
      "USER",
      "PLAYER",
      "REFEREE",
      "TOURNAMENT_ADMIN",
      "MASTER_ADMIN",
    ];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { message: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Set approval status based on role
    // Regular users are auto-approved, others need manual approval
    const isApproved = role === "USER";

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || session.user.name,
        role,
        isApproved,
      },
    });

    return NextResponse.json(
      {
        message: "User updated successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isApproved: updatedUser.isApproved,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}
