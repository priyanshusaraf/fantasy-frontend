import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    
    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }
    
    // Get all matches for the tournament
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: parseInt(tournamentId),
        status: "COMPLETED",
      },
      include: {
        playerPoints: true,
      },
    });
    
    // Calculate total points per player across all matches
    const playerPointsMap = new Map<number, number>();
    
    for (const match of matches) {
      for (const playerPoints of match.playerPoints) {
        const playerId = playerPoints.playerId;
        const points = Number(playerPoints.points);
        
        if (playerPointsMap.has(playerId)) {
          playerPointsMap.set(playerId, playerPointsMap.get(playerId)! + points);
        } else {
          playerPointsMap.set(playerId, points);
        }
      }
    }
    
    // Convert map to array and sort by points
    const playerPointsArray = Array.from(playerPointsMap.entries()).map(([playerId, totalPoints]) => ({
      playerId,
      totalPoints,
    }));
    
    // Sort by total points in descending order
    playerPointsArray.sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Add rank and fetch player details
    const rankedPlayers = await Promise.all(
      playerPointsArray.map(async (item, index) => {
        const player = await prisma.player.findUnique({
          where: { id: item.playerId },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            teamMemberships: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        
        return {
          rank: index + 1,
          playerId: item.playerId,
          totalPoints: item.totalPoints,
          playerName: player?.name,
          playerImage: player?.imageUrl,
          team: player?.teamMemberships[0],
        };
      })
    );
    
    return NextResponse.json(rankedPlayers);
  } catch (error) {
    console.error("Error fetching player points leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch player points leaderboard" }, { status: 500 });
  }
} 