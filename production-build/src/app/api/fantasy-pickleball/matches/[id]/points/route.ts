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
        tournament: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // In a real app, this would query the fantasy_points table
    // For this demo, we'll calculate some mock fantasy points based on the match data
    
    const p1Score = match.player1Score || 0;
    const p2Score = match.player2Score || 0;
    
    // Determine if this is a knockout stage match (higher points multiplier)
    const isKnockout = match.round.toLowerCase().includes('final') || 
                        match.round.toLowerCase().includes('semi') ||
                        match.round.toLowerCase().includes('quarter');
    
    const knockoutMultiplier = isKnockout ? 1.5 : 1.0;
    
    // Calculate base points - for pickleball, we'll use a simple formula based on score
    const player1BasePoints = p1Score * 1.0;
    const player2BasePoints = p2Score * 1.0;
    
    // Calculate bonuses
    const player1Bonuses: Record<string, number> = {};
    const player2Bonuses: Record<string, number> = {};
    
    // Bonus for winning
    if (match.status === "COMPLETED") {
      if (p1Score > p2Score) {
        player1Bonuses.winningMatch = 10.0;
      } else if (p2Score > p1Score) {
        player2Bonuses.winningMatch = 10.0;
      }
    }
    
    // Bonus for perfect game (11-0 or 15-0 depending on the format)
    if (p1Score >= 11 && p2Score === 0) {
      player1Bonuses.perfectGame = 7.5;
    }
    if (p2Score >= 11 && p1Score === 0) {
      player2Bonuses.perfectGame = 7.5;
    }
    
    // Bonus for close win (winning by just 2 points in a long game)
    if (p1Score >= 11 && p1Score === p2Score + 2 && p2Score >= 9) {
      player1Bonuses.closeWin = 5.0;
    }
    if (p2Score >= 11 && p2Score === p1Score + 2 && p1Score >= 9) {
      player2Bonuses.closeWin = 5.0;
    }
    
    // Calculate total points
    const p1BonusTotal = Object.values(player1Bonuses).reduce((sum, val) => sum + val, 0);
    const p2BonusTotal = Object.values(player2Bonuses).reduce((sum, val) => sum + val, 0);
    
    const p1TotalPoints = (player1BasePoints + p1BonusTotal) * knockoutMultiplier;
    const p2TotalPoints = (player2BasePoints + p2BonusTotal) * knockoutMultiplier;
    
    // Get ownership % for players (mock data for now)
    const player1OwnershipPercentage = Math.floor(Math.random() * 100);
    const player2OwnershipPercentage = Math.floor(Math.random() * 100);
    const player1CaptainPercentage = Math.floor(player1OwnershipPercentage * 0.3); // 30% of owners chose as captain
    const player2CaptainPercentage = Math.floor(player2OwnershipPercentage * 0.3);
    
    // Create fantasy points objects
    const player1FantasyPoints = {
      playerId: match.player1Id,
      playerName: match.player1.name,
      totalPoints: p1TotalPoints,
      breakdown: {
        basePoints: player1BasePoints,
        bonuses: player1Bonuses,
        knockoutMultiplier: knockoutMultiplier,
        total: p1TotalPoints
      },
      userPercentage: player1OwnershipPercentage,
      captainPercentage: player1CaptainPercentage
    };
    
    const player2FantasyPoints = {
      playerId: match.player2Id,
      playerName: match.player2.name,
      totalPoints: p2TotalPoints,
      breakdown: {
        basePoints: player2BasePoints,
        bonuses: player2Bonuses,
        knockoutMultiplier: knockoutMultiplier,
        total: p2TotalPoints
      },
      userPercentage: player2OwnershipPercentage,
      captainPercentage: player2CaptainPercentage
    };

    return NextResponse.json({
      match: {
        id: match.id,
        status: match.status,
        round: match.round,
        tournamentId: match.tournamentId,
        tournamentName: match.tournament.name,
      },
      points: [player1FantasyPoints, player2FantasyPoints],
    });
  } catch (error) {
    console.error("Error fetching fantasy points for match:", error);
    return NextResponse.json(
      { error: "Failed to fetch fantasy points" },
      { status: 500 }
    );
  }
} 