import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
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

    // Get the match with related data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        player1: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        player2: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        player3: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        player4: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        team1: {
          select: {
            id: true,
            name: true,
            players: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        team2: {
          select: {
            id: true,
            name: true,
            players: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        referee: {
          select: {
            id: true,
            name: true,
          },
        },
        setScores: {
          select: {
            id: true,
            set: true,
            team1Score: true,
            team2Score: true,
          },
          orderBy: {
            set: "asc",
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedMatch = {
      id: match.id,
      tournamentId: match.tournamentId,
      tournamentName: match.tournament.name,
      round: match.round,
      courtNumber: match.courtNumber,
      status: match.status,
      startTime: match.startTime?.toISOString(),
      endTime: match.endTime?.toISOString(),
      player1Score: match.player1Score,
      player2Score: match.player2Score,
      currentSet: match.currentSet,
      sets: match.sets,
      maxScore: match.maxScore,
      isGoldenPoint: match.isGoldenPoint,
      isDoubles: match.isDoubles,
      team1: match.isDoubles
        ? match.team1 || {
            id: 0,
            name: "Team 1",
            players: [match.player1, match.player2].filter(Boolean),
          }
        : {
            id: 0,
            name: match.player1?.name || "Player 1",
            players: [match.player1].filter(Boolean),
          },
      team2: match.isDoubles
        ? match.team2 || {
            id: 0,
            name: "Team 2",
            players: [match.player3, match.player4].filter(Boolean),
          }
        : {
            id: 0,
            name: match.player2?.name || "Player 2",
            players: [match.player2].filter(Boolean),
          },
      referee: match.referee,
      setScores: match.setScores,
    };

    return NextResponse.json(formattedMatch);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH to update match details (admin/referee only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check authorization (only admins and referees)
    if (session.user.role !== "ADMIN" && session.user.role !== "REFEREE") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    const matchId = parseInt(params.id);
    const body = await request.json();
    
    // Check if match exists and referee is assigned
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      select: { 
        id: true, 
        refereeId: true,
        status: true,
      },
    });
    
    if (!existingMatch) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }
    
    // Only assigned referee or admin can update
    if (
      session.user.role !== "ADMIN" && 
      existingMatch.refereeId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You are not authorized to update this match" },
        { status: 403 }
      );
    }
    
    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        round: body.round,
        courtNumber: body.courtNumber,
        startTime: body.startTime,
        maxScore: body.maxScore,
        sets: body.sets,
        isGoldenPoint: body.isGoldenPoint,
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        player1: true,
        player2: true,
        player3: true,
        player4: true,
        team1: {
          include: {
            players: true,
          },
        },
        team2: {
          include: {
            players: true,
          },
        },
        setScores: {
          orderBy: {
            set: "asc",
          },
        },
      },
    });
    
    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 