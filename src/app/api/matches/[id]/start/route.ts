import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    
    // Check authorization (only referees or admin)
    if (session.user.role !== "ADMIN" && session.user.role !== "REFEREE") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }
    
    // Get the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });
    
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }
    
    // Only allow the assigned referee or admin to start the match
    if (
      session.user.role !== "ADMIN" &&
      match.refereeId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You are not the assigned referee for this match" },
        { status: 403 }
      );
    }
    
    // Only scheduled matches can be started
    if (match.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Match is already ${match.status.toLowerCase()}` },
        { status: 400 }
      );
    }
    
    // Start the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "IN_PROGRESS",
        startTime: new Date(),
        // Initialize scores to zero
        player1Score: 0,
        player2Score: 0,
        // Make sure the currentSet is set to 1
        currentSet: 1,
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
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
      },
    });
    
    // Format the response
    const formattedMatch = {
      id: updatedMatch.id,
      tournamentId: updatedMatch.tournamentId,
      tournamentName: updatedMatch.tournament.name,
      round: updatedMatch.round,
      courtNumber: updatedMatch.courtNumber,
      status: updatedMatch.status,
      startTime: updatedMatch.startTime?.toISOString(),
      player1Score: updatedMatch.player1Score,
      player2Score: updatedMatch.player2Score,
      currentSet: updatedMatch.currentSet || 1,
      sets: updatedMatch.sets || 1,
      maxScore: updatedMatch.maxScore || 11,
      isGoldenPoint: updatedMatch.isGoldenPoint || false,
      isDoubles: updatedMatch.isDoubles || false,
      team1: updatedMatch.isDoubles
        ? updatedMatch.team1 || {
            id: 0,
            name: "Team 1",
            players: [updatedMatch.player1, updatedMatch.player2].filter(Boolean),
          }
        : {
            id: 0,
            name: updatedMatch.player1?.name || "Player 1",
            players: [updatedMatch.player1].filter(Boolean),
          },
      team2: updatedMatch.isDoubles
        ? updatedMatch.team2 || {
            id: 0,
            name: "Team 2",
            players: [updatedMatch.player3, updatedMatch.player4].filter(Boolean),
          }
        : {
            id: 0,
            name: updatedMatch.player2?.name || "Player 2",
            players: [updatedMatch.player2].filter(Boolean),
          },
    };
    
    return NextResponse.json(formattedMatch);
  } catch (error) {
    console.error("Error starting match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 