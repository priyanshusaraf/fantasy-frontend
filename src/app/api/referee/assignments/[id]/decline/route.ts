import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get referee ID
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user || (user.role !== "REFEREE" && user.role !== "ADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignmentId = parseInt(params.id);

    // Get the referee record
    const referee = await prisma.referee.findUnique({
      where: { userId: user.id },
    });

    if (!referee) {
      return new NextResponse("Referee record not found", { status: 404 });
    }

    // Update join request status
    const updatedAssignment = await prisma.refereeJoinRequest.update({
      where: {
        id: assignmentId,
        refereeId: referee.id,
      },
      data: {
        status: "REJECTED",
      },
    });

    return NextResponse.json({ success: true, assignment: updatedAssignment });
  } catch (error) {
    console.error("Error declining referee assignment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 