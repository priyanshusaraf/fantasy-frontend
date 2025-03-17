import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = parseInt(params.id);
    
    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    // Verify match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Get player performances from database
    // In a real app, this would query a player_performances table
    // For this demo, we'll generate some mock performance data based on the scores
    
    const p1Score = match.player1Score || 0;
    const p2Score = match.player2Score || 0;
    const totalPoints = p1Score + p2Score;
    
    // Generate performance metrics that make sense for the current score
    const player1Performance = {
      playerId: match.player1Id,
      points: p1Score,
      aces: Math.floor(p1Score * 0.2), // ~20% of points from aces
      faults: Math.floor((p2Score) * 0.15), // ~15% of opponent points from faults
      winningShots: Math.floor(p1Score * 0.6), // ~60% of points from winning shots
      errors: Math.floor(p2Score * 0.25), // ~25% of opponent points from errors
      ralliesWon: Math.floor(p1Score * 0.4), // ~40% of points from rallies
    };
    
    const player2Performance = {
      playerId: match.player2Id,
      points: p2Score,
      aces: Math.floor(p2Score * 0.2),
      faults: Math.floor((p1Score) * 0.15),
      winningShots: Math.floor(p2Score * 0.6),
      errors: Math.floor(p1Score * 0.25),
      ralliesWon: Math.floor(p2Score * 0.4),
    };

    return NextResponse.json({
      match: {
        id: match.id,
        status: match.status,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
      },
      performances: [player1Performance, player2Performance],
    });
  } catch (error) {
    console.error("Error fetching match performances:", error);
    return NextResponse.json(
      { error: "Failed to fetch match performances" },
      { status: 500 }
    );
  }
} 