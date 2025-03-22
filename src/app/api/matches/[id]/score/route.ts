// src/app/api/matches/[id]/score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Prevent caching
export const revalidate = 0; // Never revalidate, always fetch fresh data

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG] Score update API called at ${timestamp} for match ${params.id}`);
    
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Check authorization (only assigned referee or admin)
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
    
    // Check if match exists and user is the assigned referee
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        setScores: {
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
    
    // Only allow the assigned referee or admin to update scores
    if (
      session.user.role !== "ADMIN" &&
      match.refereeId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You are not the assigned referee for this match" },
        { status: 403 }
      );
    }
    
    // Only allow scoring if match is in progress
    if (match.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Match is not in progress" },
        { status: 400 }
      );
    }
    
    // Extract and log the request body for debugging
    const rawBody = await request.text();
    console.log(`[DEBUG] Raw request body: ${rawBody}`);
    const body = JSON.parse(rawBody);
    console.log(`[DEBUG] Parsed request body:`, body);
    
    const { teamNumber } = body;
    
    if (teamNumber !== 1 && teamNumber !== 2) {
      return NextResponse.json(
        { error: "Invalid team number" },
        { status: 400 }
      );
    }
    
    // Process the score update
    let player1Score = match.player1Score || 0;
    let player2Score = match.player2Score || 0;
    
    // Increment the appropriate team score
    if (teamNumber === 1) {
      player1Score += 1;
    } else {
      player2Score += 1;
    }
    
    // Create a score history entry
    await prisma.scoreHistory.create({
      data: {
        matchId: matchId,
        teamNumber: teamNumber,
        timestamp: new Date(),
        player1Score: player1Score,
        player2Score: player2Score,
        set: match.currentSet || 1,
      },
    });
    
    // Update the match score
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        player1Score,
        player2Score,
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
        setScores: {
          orderBy: {
            set: "asc",
          },
        },
      },
    });
    
    // At the end, log the response being sent
    console.log(`[DEBUG] Sending score update response for match ${params.id} at ${new Date().toISOString()}`);
    
    // Format the response to return to the client
    const formattedMatch = {
      id: updatedMatch.id,
      tournamentId: updatedMatch.tournamentId,
      tournamentName: updatedMatch.tournament.name,
      round: updatedMatch.round,
      courtNumber: updatedMatch.courtNumber,
      status: updatedMatch.status,
      startTime: updatedMatch.startTime?.toISOString(),
      endTime: updatedMatch.endTime?.toISOString(),
      player1Score: updatedMatch.player1Score,
      player2Score: updatedMatch.player2Score,
      currentSet: updatedMatch.currentSet || 1,
      sets: updatedMatch.sets || 1,
      maxScore: updatedMatch.maxScore || 11,
      isDoubles: Boolean(updatedMatch.isDoubles),
      team1: updatedMatch.team1 || {
        id: 0,
        name: "Team 1",
        players: [updatedMatch.player1, updatedMatch.player2].filter(Boolean),
      },
      team2: updatedMatch.team2 || {
        id: 0,
        name: "Team 2",
        players: [updatedMatch.player3, updatedMatch.player4].filter(Boolean),
      },
      setScores: updatedMatch.setScores,
      timestamp: Date.now() // Add timestamp to prevent caching
    };
    
    return NextResponse.json(formattedMatch, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Debug-Timestamp': timestamp
      }
    });
  } catch (error) {
    console.error("Error updating match score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Route to handle undoing the last score
export async function DELETE(
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
    
    // Check if match exists and user is the assigned referee
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });
    
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }
    
    // Only allow the assigned referee or admin to undo scores
    if (
      session.user.role !== "ADMIN" &&
      match.refereeId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You are not the assigned referee for this match" },
        { status: 403 }
      );
    }
    
    // Only allow undo if match is in progress
    if (match.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Match is not in progress" },
        { status: 400 }
      );
    }
    
    // Get the most recent score update
    const latestScore = await prisma.scoreHistory.findFirst({
      where: { matchId },
      orderBy: { timestamp: "desc" },
    });
    
    // If no score history, nothing to undo
    if (!latestScore) {
      return NextResponse.json(
        { error: "No score history to undo" },
        { status: 400 }
      );
    }
    
    // Delete the latest score record
    await prisma.scoreHistory.delete({
      where: { id: latestScore.id },
    });
    
    // Find the previous score to revert to
    const previousScore = await prisma.scoreHistory.findFirst({
      where: { matchId },
      orderBy: { timestamp: "desc" },
    });
    
    // Update the match with the previous score or reset to 0-0
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        player1Score: previousScore ? previousScore.player1Score : 0,
        player2Score: previousScore ? previousScore.player2Score : 0,
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
        setScores: {
          orderBy: {
            set: "asc",
          },
        },
      },
    });
    
    // Format the response in the same way as the POST handler
    const formattedMatch = {
      id: updatedMatch.id,
      tournamentId: updatedMatch.tournamentId,
      tournamentName: updatedMatch.tournament.name,
      round: updatedMatch.round,
      courtNumber: updatedMatch.courtNumber,
      status: updatedMatch.status,
      startTime: updatedMatch.startTime?.toISOString(),
      endTime: updatedMatch.endTime?.toISOString(),
      player1Score: updatedMatch.player1Score,
      player2Score: updatedMatch.player2Score,
      currentSet: updatedMatch.currentSet || 1,
      sets: updatedMatch.sets || 1,
      maxScore: updatedMatch.maxScore || 11,
      isDoubles: Boolean(updatedMatch.isDoubles),
      team1: updatedMatch.team1 || {
        id: 0,
        name: "Team 1",
        players: [updatedMatch.player1, updatedMatch.player2].filter(Boolean),
      },
      team2: updatedMatch.team2 || {
        id: 0,
        name: "Team 2",
        players: [updatedMatch.player3, updatedMatch.player4].filter(Boolean),
      },
      setScores: updatedMatch.setScores,
    };
    
    return NextResponse.json(formattedMatch);
  } catch (error) {
    console.error("Error undoing match score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
