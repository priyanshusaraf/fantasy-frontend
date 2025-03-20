import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    
    // Get the match with related data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
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
        setScores: true,
      },
    });
    
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }
    
    // Only allow the assigned referee or admin to complete the match
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
    
    const currentScores = {
      player1Score: match.player1Score || 0,
      player2Score: match.player2Score || 0,
    };
    
    // Determine the winning team based on the current set
    const winningTeam = currentScores.player1Score > currentScores.player2Score ? 1 : 2;
    
    // Save the final set score if it hasn't been saved already
    const currentSet = match.currentSet || 1;
    
    // Check if the current set has already been recorded
    const existingSetScore = match.setScores.find(s => s.set === currentSet);
    
    if (!existingSetScore) {
      // Save the last set
      await prisma.setScore.create({
        data: {
          matchId,
          set: currentSet,
          team1Score: currentScores.player1Score,
          team2Score: currentScores.player2Score,
        },
      });
    }
    
    // Get all completed sets to determine match result
    const completedSets = await prisma.setScore.findMany({
      where: { matchId },
    });
    
    const team1Sets = completedSets.filter(
      (set) => set.team1Score > set.team2Score
    ).length;
    
    const team2Sets = completedSets.filter(
      (set) => set.team2Score > set.team1Score
    ).length;
    
    // Update match as complete
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        endTime: new Date(),
      },
      include: {
        tournament: true,
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
    
    // Record the final match result
    try {
      // Determine overall match winner
      const matchWinner = team1Sets > team2Sets ? 1 : 2;
      
      // Prepare player IDs from winning and losing teams
      let winningPlayerIds: number[] = [];
      let losingPlayerIds: number[] = [];
      
      if (match.isDoubles) {
        // For doubles matches
        if (matchWinner === 1) {
          // Team 1 won
          if (match.team1) {
            winningPlayerIds = match.team1.players.map(p => p.id);
          } else if (match.player1Id && match.player2Id) {
            winningPlayerIds = [match.player1Id, match.player2Id].filter(Boolean);
          }
          
          if (match.team2) {
            losingPlayerIds = match.team2.players.map(p => p.id);
          } else if (match.player3Id && match.player4Id) {
            losingPlayerIds = [match.player3Id, match.player4Id].filter(Boolean);
          }
        } else {
          // Team 2 won
          if (match.team2) {
            winningPlayerIds = match.team2.players.map(p => p.id);
          } else if (match.player3Id && match.player4Id) {
            winningPlayerIds = [match.player3Id, match.player4Id].filter(Boolean);
          }
          
          if (match.team1) {
            losingPlayerIds = match.team1.players.map(p => p.id);
          } else if (match.player1Id && match.player2Id) {
            losingPlayerIds = [match.player1Id, match.player2Id].filter(Boolean);
          }
        }
      } else {
        // For singles matches
        if (matchWinner === 1) {
          winningPlayerIds = [match.player1Id].filter(Boolean);
          losingPlayerIds = [match.player2Id].filter(Boolean);
        } else {
          winningPlayerIds = [match.player2Id].filter(Boolean);
          losingPlayerIds = [match.player1Id].filter(Boolean);
        }
      }
      
      // Record match result in the database
      await prisma.matchResult.create({
        data: {
          matchId,
          tournamentId: match.tournamentId,
          winningTeam: matchWinner,
          winningTeamScore: matchWinner === 1 ? team1Sets : team2Sets,
          losingTeamScore: matchWinner === 1 ? team2Sets : team1Sets,
          completedAt: new Date(),
        },
      });
      
      // Award fantasy points to players
      // This is a simplified implementation - adapt to your scoring system
      
      // Points for winners
      for (const playerId of winningPlayerIds) {
        if (!playerId) continue;
        
        await prisma.fantasyPoints.create({
          data: {
            playerId,
            matchId,
            tournamentId: match.tournamentId,
            points: 10, // 10 points for winning
            category: "MATCH_WIN",
            description: "Match win",
          },
        });
      }
      
      // Points for participants (losers)
      for (const playerId of losingPlayerIds) {
        if (!playerId) continue;
        
        await prisma.fantasyPoints.create({
          data: {
            playerId,
            matchId,
            tournamentId: match.tournamentId,
            points: 2, // 2 points for participating
            category: "MATCH_PARTICIPATION",
            description: "Match participation",
          },
        });
      }
      
    } catch (fantasyError) {
      console.error("Error updating fantasy points:", fantasyError);
      // Continue execution, don't fail the request due to fantasy points
    }
    
    // Format the response for client
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
      team1Sets,
      team2Sets,
      winner: team1Sets > team2Sets ? 1 : 2,
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
    };
    
    return NextResponse.json(formattedMatch);
  } catch (error) {
    console.error("Error completing match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 