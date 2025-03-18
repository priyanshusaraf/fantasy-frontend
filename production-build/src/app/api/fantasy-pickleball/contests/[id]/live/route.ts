import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the contest ID from the URL parameters
    const contestId = parseInt(params.id);
    
    if (isNaN(contestId)) {
      return NextResponse.json(
        { error: "Invalid contest ID" },
        { status: 400 }
      );
    }
    
    // Get current user from session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Get the contest to verify it exists
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      include: {
        tournaments: true,
      },
    });
    
    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Fetch actual live matches data from the database
    const liveMatches = await prisma.match.findMany({
      where: {
        tournamentId: {
          in: contest.tournaments.map(t => t.id),
        },
        status: "IN_PROGRESS",
      },
      include: {
        player1: true,
        player2: true,
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10,
    });

    // Transform the matches into the expected format
    const formattedMatches = liveMatches.map(match => ({
      id: match.id,
      contestId: contestId,
      tournamentId: match.tournamentId,
      tournamentName: match.tournament.name,
      round: match.round || "Unknown Round",
      status: match.status === "IN_PROGRESS" ? "live" : 
              match.status === "COMPLETED" ? "completed" : "upcoming",
      startTime: match.startTime.toISOString(),
      court: match.courtNumber?.toString(),
      teamA: {
        id: match.player1Id,
        name: match.player1?.name || "Player 1",
        score: match.player1Score || 0,
        ownership: Math.floor(Math.random() * 100), // This would ideally come from actual data
      },
      teamB: {
        id: match.player2Id,
        name: match.player2?.name || "Player 2",
        score: match.player2Score || 0,
        ownership: Math.floor(Math.random() * 100), // This would ideally come from actual data
      },
    }));

    // Fetch leaderboard data for this contest
    const leaderboard = await prisma.fantasyTeam.findMany({
      where: {
        contestId: contestId,
      },
      select: {
        id: true,
        name: true,
        points: true,
        userId: true,
        user: {
          select: {
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        points: 'desc',
      },
    });

    // Format the leaderboard data
    const formattedLeaderboard = leaderboard.map((team, index) => ({
      id: team.id,
      rank: index + 1,
      name: team.name,
      ownerName: team.user.name || team.user.username || "Unknown User",
      points: team.points || 0,
      isUserTeam: userId ? team.userId === userId : false,
    }));

    // Return empty data - no mock entries
    return NextResponse.json({
      matches: formattedMatches,
      leaderboard: formattedLeaderboard,
      updates: [], // Empty updates array - no mock updates
    });
  } catch (error) {
    console.error("Error fetching live contest data:", error);
    return NextResponse.json(
      { error: "Failed to fetch live contest data" },
      { status: 500 }
    );
  }
} 