import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/user/leaderboard
 * Get the current user's fantasy contest entries with rank and prize information
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = parseInt(session.user.id.toString());
    
    // Get all fantasy teams created by the user
    const fantasyTeams = await prisma.fantasyTeam.findMany({
      where: {
        userId: userId,
      },
      include: {
        contest: {
          select: {
            id: true,
            name: true,
            entryFee: true,
            prizePool: true,
            status: true,
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Format the data for frontend display
    const entries = fantasyTeams.map((team) => ({
      id: team.id,
      contestId: team.contestId,
      contestName: team.contest.name,
      tournamentName: team.contest.tournament.name,
      rank: team.rank || 0,
      totalPoints: parseFloat(team.totalPoints.toString()),
      // Calculate expected prize based on rank and prize pool
      expectedPrize: team.rank && team.rank <= 3 ? (
        team.rank === 1 ? team.contest.prizePool * 0.5 :
        team.rank === 2 ? team.contest.prizePool * 0.3 :
        team.rank === 3 ? team.contest.prizePool * 0.1 : 0
      ) : 0,
      // Mock previous rank for UI demonstration
      previousRank: team.rank ? (Math.random() > 0.5 ? team.rank + Math.floor(Math.random() * 3) : Math.max(1, team.rank - Math.floor(Math.random() * 3))) : undefined,
    }));
    
    return NextResponse.json({ 
      entries,
      count: entries.length
    });
  } catch (error) {
    console.error("Error fetching user leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
} 