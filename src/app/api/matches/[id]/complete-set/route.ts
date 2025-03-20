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
    
    // Get the match details to work with
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        setScores: true,
      },
    });
    
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }
    
    // Only allow the assigned referee or admin to complete the set
    if (
      session.user.role !== "ADMIN" &&
      match.refereeId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You are not the assigned referee for this match" },
        { status: 403 }
      );
    }
    
    // Only allow if match is in progress
    if (match.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Match is not in progress" },
        { status: 400 }
      );
    }
    
    // Get current scores
    const player1Score = match.player1Score || 0;
    const player2Score = match.player2Score || 0;
    const currentSet = match.currentSet || 1;
    const totalSets = match.sets || 1;
    
    // Save the current set score
    await prisma.setScore.create({
      data: {
        matchId,
        set: currentSet,
        team1Score: player1Score,
        team2Score: player2Score,
      },
    });
    
    // Determine next steps based on set count
    let status = "IN_PROGRESS";
    let isMatchComplete = false;
    
    // Count completed sets and determine winner
    const completedSets = await prisma.setScore.findMany({
      where: { matchId },
    });
    
    const team1Sets = completedSets.filter(
      (set) => set.team1Score > set.team2Score
    ).length;
    
    const team2Sets = completedSets.filter(
      (set) => set.team2Score > set.team1Score
    ).length;
    
    // Check if match is complete (one team has won majority of sets)
    const setsToWin = Math.ceil(totalSets / 2);
    if (team1Sets >= setsToWin || team2Sets >= setsToWin) {
      isMatchComplete = true;
      status = "COMPLETED";
    }
    
    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        // If match complete, keep final scores; otherwise reset for next set
        player1Score: isMatchComplete ? player1Score : 0,
        player2Score: isMatchComplete ? player2Score : 0,
        
        // Move to next set if not complete
        currentSet: isMatchComplete ? currentSet : currentSet + 1,
        
        // Update match status if complete
        status,
        
        // If match is complete, set end time
        ...(isMatchComplete ? { endTime: new Date() } : {}),
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
    
    // Update fantasy points if match is complete
    if (isMatchComplete) {
      try {
        // Determine the winning team
        const winningTeamNumber = team1Sets > team2Sets ? 1 : 2;
        
        // Prepare player IDs from winning and losing teams
        let winningPlayerIds: number[] = [];
        let losingPlayerIds: number[] = [];
        
        if (updatedMatch.isDoubles) {
          // For doubles matches
          if (winningTeamNumber === 1) {
            // Team 1 won
            if (updatedMatch.team1) {
              winningPlayerIds = updatedMatch.team1.players.map(p => p.id);
            } else if (updatedMatch.player1Id && updatedMatch.player2Id) {
              winningPlayerIds = [updatedMatch.player1Id, updatedMatch.player2Id].filter(Boolean);
            }
            
            if (updatedMatch.team2) {
              losingPlayerIds = updatedMatch.team2.players.map(p => p.id);
            } else if (updatedMatch.player3Id && updatedMatch.player4Id) {
              losingPlayerIds = [updatedMatch.player3Id, updatedMatch.player4Id].filter(Boolean);
            }
          } else {
            // Team 2 won
            if (updatedMatch.team2) {
              winningPlayerIds = updatedMatch.team2.players.map(p => p.id);
            } else if (updatedMatch.player3Id && updatedMatch.player4Id) {
              winningPlayerIds = [updatedMatch.player3Id, updatedMatch.player4Id].filter(Boolean);
            }
            
            if (updatedMatch.team1) {
              losingPlayerIds = updatedMatch.team1.players.map(p => p.id);
            } else if (updatedMatch.player1Id && updatedMatch.player2Id) {
              losingPlayerIds = [updatedMatch.player1Id, updatedMatch.player2Id].filter(Boolean);
            }
          }
        } else {
          // For singles matches
          if (winningTeamNumber === 1) {
            winningPlayerIds = [updatedMatch.player1Id].filter(Boolean);
            losingPlayerIds = [updatedMatch.player2Id].filter(Boolean);
          } else {
            winningPlayerIds = [updatedMatch.player2Id].filter(Boolean);
            losingPlayerIds = [updatedMatch.player1Id].filter(Boolean);
          }
        }
        
        // Record match result in the database
        await prisma.matchResult.create({
          data: {
            matchId,
            winningTeam: winningTeamNumber,
            winningTeamScore: winningTeamNumber === 1 ? team1Sets : team2Sets,
            losingTeamScore: winningTeamNumber === 1 ? team2Sets : team1Sets,
            completedAt: new Date(),
          },
        });
        
        // Update fantasy points for the players
        // This is a simplified example, you'll need to adapt to your fantasy scoring system
        for (const playerId of winningPlayerIds) {
          await prisma.fantasyPoints.create({
            data: {
              playerId,
              matchId,
              tournamentId: updatedMatch.tournamentId,
              points: 10, // Points for winning
              category: "MATCH_WIN",
              description: "Match win",
            },
          });
        }
        
        for (const playerId of losingPlayerIds) {
          await prisma.fantasyPoints.create({
            data: {
              playerId,
              matchId,
              tournamentId: updatedMatch.tournamentId,
              points: 2, // Points for participating
              category: "MATCH_PARTICIPATION",
              description: "Match participation",
            },
          });
        }
      } catch (fantasyError) {
        console.error("Error updating fantasy points:", fantasyError);
        // Continue execution, don't fail the request
      }
    }
    
    // Return formatted response
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
      currentSet: updatedMatch.currentSet,
      sets: updatedMatch.sets,
      maxScore: updatedMatch.maxScore,
      isDoubles: updatedMatch.isDoubles,
      isGoldenPoint: updatedMatch.isGoldenPoint,
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
      setScores: updatedMatch.setScores,
      completedSet: currentSet,
      team1Sets,
      team2Sets,
      isMatchComplete,
    };
    
    return NextResponse.json(formattedMatch);
  } catch (error) {
    console.error("Error completing set:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 