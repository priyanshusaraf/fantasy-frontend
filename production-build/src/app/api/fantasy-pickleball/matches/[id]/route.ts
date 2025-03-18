import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate matchId
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    // Get current user from session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Fetch match data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        team1: true,
        team2: true,
        court: true,
        tournament: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // In a real app, these would be calculated based on actual fantasy team data
    // For now, we'll use mock data
    const teamAOwnership = Math.floor(Math.random() * 90) + 10; // 10% to 99%
    const teamBOwnership = Math.floor(Math.random() * 90) + 10; // 10% to 99%
    const teamAFantasyPoints = match.status === "COMPLETED" ? (Math.random() * 20) + 5 : (Math.random() * 10) + 2;
    const teamBFantasyPoints = match.status === "COMPLETED" ? (Math.random() * 20) + 5 : (Math.random() * 10) + 2;

    // Format match data for the frontend
    const formattedMatch = {
      id: match.id,
      contestId: match.tournamentId, // In a real app, you would get the actual contestId
      tournamentId: match.tournamentId,
      tournamentName: match.tournament.name,
      round: match.round || "Unknown",
      court: match.court?.name || "Court " + (match.courtId || "TBD"),
      status: mapMatchStatus(match.status),
      startTime: match.scheduledTime.toISOString(),
      teamA: {
        id: match.team1Id,
        name: match.team1.name,
        profileImage: match.team1.profileImageUrl,
        score: match.team1Score,
        ownership: teamAOwnership,
        fantasyPoints: teamAFantasyPoints,
        scoreHistory: generateMockScoreHistory(match.team1Score),
      },
      teamB: {
        id: match.team2Id,
        name: match.team2.name,
        profileImage: match.team2.profileImageUrl,
        score: match.team2Score,
        ownership: teamBOwnership,
        fantasyPoints: teamBFantasyPoints,
        scoreHistory: generateMockScoreHistory(match.team2Score),
      },
    };

    // Generate mock updates
    const updates = generateMockUpdates(formattedMatch, 20);

    return NextResponse.json({
      match: formattedMatch,
      updates,
    });
  } catch (error) {
    console.error("Error fetching match details:", error);
    return NextResponse.json(
      { error: "Failed to fetch match details" },
      { status: 500 }
    );
  }
}

// Helper function to map database match status to frontend status
function mapMatchStatus(status: string): "upcoming" | "live" | "completed" {
  switch (status) {
    case "SCHEDULED":
    case "UPCOMING":
      return "upcoming";
    case "IN_PROGRESS":
      return "live";
    case "COMPLETED":
    case "CANCELLED":
      return "completed";
    default:
      return "upcoming";
  }
}

// Helper function to generate mock score history
function generateMockScoreHistory(finalScore: number): number[] {
  const history = [];
  let currentScore = 0;
  
  while (currentScore < finalScore) {
    currentScore += 1;
    history.push(currentScore);
  }
  
  return history;
}

// Helper function to generate mock updates
function generateMockUpdates(match: any, count: number) {
  const updateTypes = ["score", "point", "match"];
  const pointReasons = [
    "Winner down the line",
    "Perfect volley",
    "Ace serve",
    "Passing shot",
    "Great defense",
    "Unforced error",
    "Double fault",
    "Third shot drop",
    "Dink winner",
    "Lob winner",
  ];
  
  const updates = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - Math.floor(Math.random() * 3600000)); // Random time in the past hour
    const isTeamA = Math.random() > 0.5;
    const team = isTeamA ? match.teamA : match.teamB;
    const type = updateTypes[Math.floor(Math.random() * updateTypes.length)];
    const isPositive = Math.random() > 0.3;
    const points = isPositive ? (Math.floor(Math.random() * 3) + 1) : -1;
    
    let description = "";
    
    if (type === "score") {
      description = `${team.name} scored a point in ${match.tournamentName}`;
    } else if (type === "point") {
      const reason = pointReasons[Math.floor(Math.random() * pointReasons.length)];
      description = `${team.name}: ${reason} (${match.round})`;
    } else {
      description = `Match update: ${match.teamA.name} vs ${match.teamB.name} - ${match.tournamentName}`;
    }
    
    updates.push({
      id: `update-${i}`,
      timestamp: time.toISOString(),
      type,
      description,
      points: type !== "match" ? points : undefined,
      player: {
        id: team.id,
        name: team.name,
      },
      team: {
        id: team.id,
        name: team.name,
      },
      matchId: match.id,
      contestId: match.contestId,
      isPositive: isPositive,
    });
  }
  
  // Sort by timestamp, most recent first
  return updates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
} 