import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Match, Player } from "@prisma/client";

// Define types for the nested data structure
interface PlayerWithPerformances extends Player {
  matchPerformances: Array<{
    points: number;
    match: Match | null;
  }>;
}

interface TeamWithPlayers {
  id: number;
  name: string;
  tournamentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  players: PlayerWithPerformances[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    
    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }
    
    // Get all teams for the tournament
    const teams = await prisma.team.findMany({
      where: {
        tournamentId: parseInt(tournamentId),
      },
      include: {
        players: {
          include: {
            matchPerformances: {
              include: {
                match: {
                  where: {
                    tournamentId: parseInt(tournamentId),
                    status: "COMPLETED",
                  },
                },
              },
            },
          },
        },
      },
    }) as unknown as TeamWithPlayers[];
    
    // Calculate team standings based on player performances
    const teamStandings = teams.map((team) => {
      let totalPoints = 0;
      let matchesPlayed = 0;
      let matchesWon = 0;
      
      team.players.forEach((player) => {
        player.matchPerformances.forEach((performance) => {
          if (performance.match) {
            totalPoints += performance.points;
            matchesPlayed++;
            
            // Determine if player won the match
            const match = performance.match;
            if (
              (match.player1Id === player.id && match.player1Score! > match.player2Score!) ||
              (match.player2Id === player.id && match.player2Score! > match.player1Score!)
            ) {
              matchesWon++;
            }
          }
        });
      });
      
      const winRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;
      
      return {
        id: team.id,
        name: team.name,
        totalPoints,
        matchesPlayed,
        matchesWon,
        winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
      };
    });
    
    // Sort teams by total points
    teamStandings.sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Add rank
    const rankedTeams = teamStandings.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
    
    return NextResponse.json(rankedTeams);
  } catch (error) {
    console.error("Error fetching team standings:", error);
    return NextResponse.json({ error: "Failed to fetch team standings" }, { status: 500 });
  }
} 