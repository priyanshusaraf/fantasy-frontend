// src/app/api/fantasy-pickleball/calculate-points/[matchId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Check authentication and permissions
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { user } = request as any;
    const matchId = parseInt(params.matchId);

    // Only allow admins and referees to trigger point calculation
    if (!["REFEREE", "TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Not authorized to calculate points" },
        { status: 403 }
      );
    }

    // Get match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        performances: {
          include: {
            player: true,
          },
        },
        player1: true,
        player2: true,
      },
    });

    if (!match) {
      return NextResponse.json({ message: "Match not found" }, { status: 404 });
    }

    if (match.status !== "COMPLETED") {
      return NextResponse.json(
        { message: "Cannot calculate points for unfinished match" },
        { status: 400 }
      );
    }

    // Get all fantasy contests for this tournament
    const contests = await prisma.fantasyContest.findMany({
      where: {
        tournamentId: match.tournamentId,
        status: "IN_PROGRESS",
      },
    });

    // Create a transaction to update all points
    await prisma.$transaction(async (tx) => {
      // Process each player's performance and calculate base points
      for (const performance of match.performances) {
        const player = performance.player;
        let basePoints = performance.points;

        // Calculate if this is a knockout match
        const isKnockout =
          match.round.toLowerCase().includes("final") ||
          match.round.toLowerCase().includes("semi") ||
          match.round.toLowerCase().includes("quarter");

        // Apply bonus points for winning scenarios
        const player1Score = match.player1Score || 0;
        const player2Score = match.player2Score || 0;

        const isPlayerOne = player.id === match.player1Id;
        const playerScore = isPlayerOne ? player1Score : player2Score;
        const opponentScore = isPlayerOne ? player2Score : player1Score;

        let bonusPoints = 0;

        // Check if player won
        if (
          (isPlayerOne && player1Score > player2Score) ||
          (!isPlayerOne && player2Score > player1Score)
        ) {
          // Perfect game bonus (11-0)
          if (opponentScore === 0) {
            bonusPoints += 15;
          }
          // Close game bonus (winning by less than 5 points)
          else if (playerScore - opponentScore < 5) {
            bonusPoints += 10;
          }
        }

        // Calculate total base points with bonuses
        let totalBasePoints = basePoints + bonusPoints;

        // Apply knockout stage multiplier
        if (isKnockout) {
          totalBasePoints *= 1.5;
        }

        // Record player's base points for this match
        await tx.playerMatchPoints.upsert({
          where: {
            playerId_matchId: {
              playerId: player.id,
              matchId,
            },
          },
          update: {
            points: totalBasePoints,
            breakdown: {
              basePoints,
              bonusPoints,
              isKnockout,
              knockoutMultiplier: isKnockout ? 1.5 : 1,
            },
          },
          create: {
            playerId: player.id,
            matchId,
            points: totalBasePoints,
            breakdown: {
              basePoints,
              bonusPoints,
              isKnockout,
              knockoutMultiplier: isKnockout ? 1.5 : 1,
            },
          },
        });
      }

      // Process each contest
      for (const contest of contests) {
        // Get all teams in this contest
        const teams = await tx.fantasyTeam.findMany({
          where: {
            contestId: contest.id,
          },
          include: {
            players: true,
          },
        });

        // Update points for each team based on player performances
        for (const team of teams) {
          let teamPointsForThisMatch = 0;

          // Process each player in the team
          for (const teamPlayer of team.players) {
            // Get player's points for this match
            const playerMatchPoints = await tx.playerMatchPoints.findUnique({
              where: {
                playerId_matchId: {
                  playerId: teamPlayer.playerId,
                  matchId,
                },
              },
            });

            if (playerMatchPoints) {
              let playerPoints = Number(playerMatchPoints.points);

              // Apply captain/vice-captain multipliers
              if (teamPlayer.isCaptain) {
                playerPoints *= 2; // Captain gets 2x points
              } else if (teamPlayer.isViceCaptain) {
                playerPoints *= 1.5; // Vice-captain gets 1.5x points
              }

              teamPointsForThisMatch += playerPoints;

              // Create or update player match points record with captain/vc info
              await tx.playerMatchPoints.update({
                where: {
                  playerId_matchId: {
                    playerId: teamPlayer.playerId,
                    matchId,
                  },
                },
                data: {
                  breakdown: {
                    ...playerMatchPoints.breakdown,
                    isCaptain: teamPlayer.isCaptain,
                    isViceCaptain: teamPlayer.isViceCaptain,
                    captainMultiplier: teamPlayer.isCaptain
                      ? 2
                      : teamPlayer.isViceCaptain
                      ? 1.5
                      : 1,
                    finalPoints: playerPoints,
                  },
                },
              });
            }
          }

          // Update team's total points
          await tx.fantasyTeam.update({
            where: { id: team.id },
            data: {
              totalPoints: {
                increment: teamPointsForThisMatch,
              },
            },
          });
        }
      }

      // Update contest rankings
      for (const contest of contests) {
        // Get all teams ordered by points
        const rankedTeams = await tx.fantasyTeam.findMany({
          where: { contestId: contest.id },
          orderBy: { totalPoints: "desc" },
        });

        // Update rankings
        for (let i = 0; i < rankedTeams.length; i++) {
          await tx.fantasyTeam.update({
            where: { id: rankedTeams[i].id },
            data: { rank: i + 1 },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Fantasy points calculated successfully for match " + matchId,
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
