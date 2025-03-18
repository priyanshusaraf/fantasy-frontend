import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch actual live matches from database
    const matches = await prisma.match.findMany({
      where: {
        status: "IN_PROGRESS",
      },
      include: {
        player1: true,
        player2: true,
        tournament: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 5, // Limit to 5 most recent matches
    });

    // Transform data to expected format
    const formattedMatches = matches.map(match => ({
      id: match.id,
      teamA: {
        name: match.player1?.name || "Player 1",
        score: match.player1Score || 0,
      },
      teamB: {
        name: match.player2?.name || "Player 2",
        score: match.player2Score || 0,
      },
      status: "live",
      tournamentName: match.tournament.name,
      round: match.round || "Unknown Round",
    }));

    return NextResponse.json({
      matches: formattedMatches,
    });
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch live matches", matches: [] },
      { status: 500 }
    );
  }
} 