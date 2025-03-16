import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/tournaments/[id]/players
 * Get all players in a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id);

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get all players in the tournament
    const tournamentEntries = await prisma.tournamentEntry.findMany({
      where: { tournamentId },
      include: {
        player: true,
      },
    });

    const players = tournamentEntries.map((entry) => entry.player);

    return NextResponse.json({ players });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * POST /api/tournaments/[id]/players
 * Add a player to a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { user } = request as any;
    const tournamentId = parseInt(params.id);

    // Only admin, tournament_admin and master_admin can add players
    if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Not authorized to add players to tournaments" },
        { status: 403 }
      );
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get player data from request body
    const body = await request.json();
    
    // Handle both single player addition and multiple player addition
    const playerIds = body.playerIds || (body.playerId ? [body.playerId] : []);
    
    if (playerIds.length === 0) {
      return NextResponse.json(
        { message: "No players specified" },
        { status: 400 }
      );
    }

    // Create tournament entries for each player
    const results = await Promise.all(
      playerIds.map(async (playerId: number) => {
        // Check if player already in tournament
        const existingEntry = await prisma.tournamentEntry.findUnique({
          where: {
            tournamentId_playerId: {
              tournamentId,
              playerId,
            },
          },
        });

        if (existingEntry) {
          return { playerId, status: "already_added" };
        }

        // Add player to tournament
        await prisma.tournamentEntry.create({
          data: {
            tournamentId,
            playerId,
            paymentStatus: "PAID", // Assume admin-added players have paid
          },
        });

        return { playerId, status: "added" };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * DELETE /api/tournaments/[id]/players/[playerId]
 * Remove a player from a tournament
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { user } = request as any;
    const tournamentId = parseInt(params.id);

    // Only admin, tournament_admin and master_admin can remove players
    if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Not authorized to remove players from tournaments" },
        { status: 403 }
      );
    }

    // Get player ID from URL or request body
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const playerIdFromPath = pathParts[pathParts.length - 1];
    
    let playerId: number;
    
    if (playerIdFromPath && playerIdFromPath !== 'players') {
      playerId = parseInt(playerIdFromPath);
    } else {
      const body = await request.json();
      playerId = body.playerId;
    }

    if (!playerId) {
      return NextResponse.json(
        { message: "Player ID is required" },
        { status: 400 }
      );
    }

    // Remove player from tournament
    await prisma.tournamentEntry.delete({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId,
        },
      },
    });

    return NextResponse.json({ message: "Player removed from tournament" });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 