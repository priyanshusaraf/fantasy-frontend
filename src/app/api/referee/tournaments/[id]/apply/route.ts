import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.role !== "REFEREE" && user.role !== "ADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return new NextResponse("Tournament not found", { status: 404 });
    }

    // Check if user has already applied or is already assigned
    const existingApplication = await prisma.refereeApplication.findFirst({
      where: {
        userId: user.id,
        tournamentId,
      },
    });

    if (existingApplication) {
      return new NextResponse("Already applied to this tournament", { status: 409 });
    }

    // Create referee application
    const application = await prisma.refereeApplication.create({
      data: {
        userId: user.id,
        tournamentId,
        status: "PENDING",
        appliedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Error applying to tournament:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 