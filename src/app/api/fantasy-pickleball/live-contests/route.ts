import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the URL searchParams
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get("contestId");

    // If contestId is provided, get detailed information for that contest
    if (contestId) {
      const parsedContestId = parseInt(contestId);
      
      if (isNaN(parsedContestId)) {
        return NextResponse.json(
          { error: "Invalid contest ID" },
          { status: 400 }
        );
      }

      // Get contest details
      const contest = await prisma.fantasyContest.findUnique({
        where: { id: parsedContestId },
        include: {
          tournament: true,
        },
      });

      if (!contest) {
        return NextResponse.json(
          { error: "Contest not found" },
          { status: 404 }
        );
      }

      // Get user's team for this contest
      const userTeam = await prisma.fantasyTeam.findFirst({
        where: {
          contestId: parsedContestId,
          userId: userId,
        },
        include: {
          players: {
            include: {
              player: true,
            },
          },
        },
      });

      // Get live matches for the tournament
      const liveMatches = await prisma.match.findMany({
        where: {
          tournamentId: contest.tournamentId,
          status: { in: ["IN_PROGRESS", "COMPLETED"] },
        },
        include: {
          player1: true,
          player2: true,
          tournament: true,
        },
        orderBy: [
          { status: "asc" }, // IN_PROGRESS first, then COMPLETED
          { startTime: "desc" }, // Most recent first
        ],
      });

      // Get contest leaderboard
      const leaderboard = await prisma.fantasyTeam.findMany({
        where: {
          contestId: parsedContestId,
        },
        orderBy: {
          totalPoints: "desc",
        },
        include: {
          user: true,
        },
      });

      // Transform leaderboard to include rank
      const rankedLeaderboard = leaderboard.map((team, index) => ({
        id: team.id,
        rank: index + 1,
        previousRank: index + 1, // Would be calculated from historical data in a real app
        teamName: team.name,
        ownerName: team.user.name || "Unknown",
        profileImage: team.user.image,
        points: team.totalPoints || 0,
        isCurrentUserTeam: team.userId === userId,
      }));

      // Generate recent points updates (mock data)
      const recentUpdates = liveMatches
        .filter(match => match.status === "IN_PROGRESS")
        .flatMap(match => {
          // Generate between 0-3 updates per live match
          const updateCount = Math.floor(Math.random() * 4);
          return Array.from({ length: updateCount }).map((_, i) => {
            const isPlayer1 = Math.random() > 0.5;
            const playerId = isPlayer1 ? match.player1Id : match.player2Id;
            const playerName = isPlayer1 ? match.player1.name : match.player2.name;
            const points = Math.random() * 5 + 1; // 1-6 points
            
            return {
              id: `${match.id}-${playerId}-${i}`,
              matchId: match.id,
              playerId: playerId,
              playerName: playerName,
              tournamentName: match.tournament.name,
              points: parseFloat(points.toFixed(1)),
              reason: getRandomPointReason(),
              timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 30).toISOString(), // Within last 30 mins
            };
          });
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort by timestamp
        .slice(0, 10); // Only return the 10 most recent

      return NextResponse.json({
        contest,
        userTeam,
        liveMatches,
        leaderboard: rankedLeaderboard,
        recentUpdates,
      });
    }

    // Otherwise, return a list of active contests the user has joined
    const activeContests = await prisma.fantasyContest.findMany({
      where: {
        // Only include contests where the tournament has started but not ended yet
        // or has ended in the last 24 hours
        tournament: {
          OR: [
            {
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
            {
              endDate: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                lte: new Date(),
              },
            },
          ],
        },
        // Only include contests the user has joined
        teams: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        tournament: true,
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    // Get the current status of each contest
    const contestsWithStatus = await Promise.all(
      activeContests.map(async (contest) => {
        // Get the user's team rank in this contest
        const userTeam = await prisma.fantasyTeam.findFirst({
          where: {
            contestId: contest.id,
            userId: userId,
          },
          select: {
            id: true,
            name: true,
            totalPoints: true,
          },
        });

        // Count how many teams have higher points than the user's team
        const userRank = userTeam
          ? await prisma.fantasyTeam.count({
              where: {
                contestId: contest.id,
                totalPoints: { gt: userTeam.totalPoints || 0 },
              },
            }) + 1
          : null;

        // Count how many matches are live in this tournament
        const liveMatchesCount = await prisma.match.count({
          where: {
            tournamentId: contest.tournamentId,
            status: "IN_PROGRESS",
          },
        });

        // Count total matches in the tournament
        const totalMatchesCount = await prisma.match.count({
          where: {
            tournamentId: contest.tournamentId,
          },
        });

        // Count completed matches
        const completedMatchesCount = await prisma.match.count({
          where: {
            tournamentId: contest.tournamentId,
            status: "COMPLETED",
          },
        });

        return {
          id: contest.id,
          name: contest.name,
          entryFee: contest.entryFee,
          totalPrize: contest.totalPrize,
          startDate: contest.tournament.startDate,
          endDate: contest.tournament.endDate,
          tournamentName: contest.tournament.name,
          status: getContestStatus(contest.tournament.startDate, contest.tournament.endDate),
          userTeam: userTeam
            ? {
                id: userTeam.id,
                name: userTeam.name,
                rank: userRank,
                totalTeams: contest._count.teams,
                points: userTeam.totalPoints || 0,
              }
            : null,
          liveMatches: liveMatchesCount,
          totalMatches: totalMatchesCount,
          completedMatches: completedMatchesCount,
        };
      })
    );

    return NextResponse.json({
      contests: contestsWithStatus,
    });
  } catch (error) {
    console.error("Error fetching live contests:", error);
    return NextResponse.json(
      { error: "Failed to fetch contests" },
      { status: 500 }
    );
  }
}

// Helper function to determine contest status
function getContestStatus(startDate: Date, endDate: Date): string {
  const now = new Date();
  
  if (now < startDate) {
    return "UPCOMING";
  } else if (now > endDate) {
    return "COMPLETED";
  } else {
    return "LIVE";
  }
}

// Helper function to generate random point reason
function getRandomPointReason(): string {
  const reasons = [
    "Winning shot",
    "Rally won",
    "Ace serve",
    "Winning a close set",
    "Defensive save",
    "Perfect game",
    "Match completed",
    "Performance bonus"
  ];
  
  return reasons[Math.floor(Math.random() * reasons.length)];
} 