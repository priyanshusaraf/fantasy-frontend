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

    // Delete related records based on user role
    if (user.role === "REFEREE") {
      await prisma.referee.delete({
        where: { userId: userId },
      }).catch(e => console.log("No referee record to delete"));
    } else if (user.role === "TOURNAMENT_ADMIN") {
      await prisma.tournamentAdmin.delete({
        where: { userId: userId },
      }).catch(e => console.log("No tournament admin record to delete"));
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Return success message
    return NextResponse.json({
      message: "User rejected and removed successfully"
    });
  } catch (error) {
    console.error("Error rejecting user:", error);
    return NextResponse.json(
      { message: "Error rejecting user" },
      { status: 500 }
    );
  }
} 