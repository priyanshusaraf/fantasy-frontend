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

    const tournamentId = parseInt(params.id);

    // Check if the tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return new NextResponse("Tournament not found", { status: 404 });
    }

    // Check if the referee record exists, create if not
    let referee = await prisma.referee.findUnique({
      where: { userId: user.id },
    });

    if (!referee) {
      referee = await prisma.referee.create({
        data: {
          userId: user.id,
          certificationLevel: "BASIC", // Default certification level
        },
      });
    }

    // Check if already applied
    const existingRequest = await prisma.refereeJoinRequest.findFirst({
      where: {
        refereeId: referee.id,
        tournamentId: tournamentId,
      },
    });

    if (existingRequest) {
      return new NextResponse("Already applied to this tournament", { status: 400 });
    }

    // Create the join request
    const joinRequest = await prisma.refereeJoinRequest.create({
      data: {
        refereeId: referee.id,
        tournamentId: tournamentId,
        status: "PENDING",
        message: request.body ? await request.json().then(data => data.message) : null,
      },
    });

    return NextResponse.json({ success: true, request: joinRequest });
  } catch (error) {
    console.error("Error joining tournament:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 