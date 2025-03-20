import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canRegisterForTournament } from "@/utils/tournament";

/**
 * POST /api/tournaments/[id]/entries
 * Register a user for a tournament 
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate the tournament ID
    const tournamentId = parseInt(params.id);
    if (isNaN(tournamentId)) {
      return new NextResponse("Invalid tournament ID", { status: 400 });
    }

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the tournament with current participant count
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });

    if (!tournament) {
      return new NextResponse("Tournament not found", { status: 404 });
    }

    // Check if registration is allowed using our utility function
    const registrationCheck = canRegisterForTournament({
      status: tournament.status,
      registrationOpenDate: tournament.registrationOpenDate,
      registrationCloseDate: tournament.registrationCloseDate,
      startDate: tournament.startDate,
      maxParticipants: tournament.maxParticipants,
      currentParticipants: tournament._count.entries
    });

    if (!registrationCheck.allowed) {
      return new NextResponse(registrationCheck.reason || "Registration not allowed", { status: 403 });
    }

    // Get player ID from request body or user session
    const { playerId } = await request.json();
    
    // Check if player is already registered
    const existingEntry = await prisma.tournamentEntry.findFirst({
      where: {
        tournamentId,
        playerId: playerId,
      },
    });

    if (existingEntry) {
      return new NextResponse("Player is already registered for this tournament", { status: 409 });
    }

    // Register the player
    const entry = await prisma.tournamentEntry.create({
      data: {
        tournamentId,
        playerId,
        paymentStatus: tournament.entryFee.equals(0) ? "PAID" : "PENDING",
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error registering for tournament:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}

/**
 * GET /api/tournaments/[id]/entries
 * Get all entries for a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate the tournament ID
    const tournamentId = parseInt(params.id);
    if (isNaN(tournamentId)) {
      return new NextResponse("Invalid tournament ID", { status: 400 });
    }

    // Get the tournament entries
    const entries = await prisma.tournamentEntry.findMany({
      where: { tournamentId },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            skillLevel: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { registeredAt: "asc" },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching tournament entries:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
} 