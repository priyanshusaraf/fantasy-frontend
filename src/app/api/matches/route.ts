import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/matches
 * Get all matches or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tournamentId = url.searchParams.get("tournamentId");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    // Build filter conditions
    const whereConditions: any = {};

    if (status) {
      whereConditions.status = status;
    }

    if (tournamentId) {
      whereConditions.tournamentId = parseInt(tournamentId);
    }

    // Get matches from database
    const matches = await prisma.match.findMany({
      where: whereConditions,
      take: limit,
      orderBy: {
        startTime: "asc",
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
          }
        },
        referee: {
          include: {
            user: {
              select: {
                username: true,
              }
            }
          }
        },
      },
    });

    // Format the matches for response
    const formattedMatches = matches.map(match => ({
      id: match.id,
      tournamentId: match.tournamentId,
      tournamentName: match.tournament.name,
      player1Name: match.player1?.name || "TBD",
      player2Name: match.player2?.name || "TBD",
      court: match.courtNumber || "TBD",
      scheduledTime: match.startTime.toISOString(),
      status: match.status,
      refereeName: match.referee?.user?.username || null,
      score: match.score,
      round: match.round
    }));

    return NextResponse.json(formattedMatches);
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 