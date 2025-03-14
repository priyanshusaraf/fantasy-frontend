// src/lib/services/scoring-service.ts
import prisma from "../../../prisma";
import { Prisma, MatchStatus } from "@prisma/client";
import { FantasyService } from "./fantasy-service";

export class ScoringService {
  /**
   * Start a match
   */
  static async startMatch(matchId: number) {
    try {
      return await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "IN_PROGRESS",
          startTime: new Date(),
        },
        include: {
          player1: true,
          player2: true,
          referee: true,
          tournament: true,
        },
      });
    } catch (error) {
      console.error(`Error starting match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Update score during a match
   */
  static async updateScore(
    matchId: number,
    data: {
      player1Score?: number;
      player2Score?: number;
    }
  ) {
    try {
      return await prisma.match.update({
        where: { id: matchId },
        data: {
          player1Score: data.player1Score,
          player2Score: data.player2Score,
        },
      });
    } catch (error) {
      console.error(`Error updating score for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Record match performance for a player
   */
  static async recordPerformance(data: Prisma.MatchPerformanceCreateInput) {
    try {
      return await prisma.matchPerformance.create({
        data,
      });
    } catch (error) {
      console.error("Error recording match performance:", error);
      throw error;
    }
  }

  /**
   * Complete a match and process results
   */
  static async completeMatch(
    matchId: number,
    data: {
      player1Score: number;
      player2Score: number;
      performances: Array<{
        playerId: number;
        points: number;
        aces: number;
        faults: number;
        winningShots: number;
        otherStats?: Record<string, any>;
      }>;
      matchDuration?: number;
    }
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the match
        const match = await tx.match.findUnique({
          where: { id: matchId },
          include: {
            tournament: true,
            player1: true,
            player2: true,
          },
        });

        if (!match) {
          throw new Error("Match not found");
        }

        if (match.status === "COMPLETED") {
          throw new Error("Match is already completed");
        }

        // Determine the winner
        const winner =
          data.player1Score > data.player2Score
            ? match.player1Id
            : match.player2Id;
        const loser =
          data.player1Score > data.player2Score
            ? match.player2Id
            : match.player1Id;

        // Record all performances
        for (const perf of data.performances) {
          await tx.matchPerformance.create({
            data: {
              match: { connect: { id: matchId } },
              player: { connect: { id: perf.playerId } },
              points: perf.points,
              aces: perf.aces,
              faults: perf.faults,
              winningShots: perf.winningShots,
              otherStats: perf.otherStats || {},
            },
          });
        }

        // Update the match
        const completedMatch = await tx.match.update({
          where: { id: matchId },
          data: {
            status: "COMPLETED",
            player1Score: data.player1Score,
            player2Score: data.player2Score,
            endTime: new Date(),
            matchDuration: data.matchDuration,
          },
        });

        // Update player stats
        await this.updatePlayerStats(tx, match.tournamentId, winner, true);
        await this.updatePlayerStats(tx, match.tournamentId, loser, false);

        // Calculate bonus points for fantasy
        const winMargin = Math.abs(data.player1Score - data.player2Score);
        const bonusPoints = this.calculateBonusPoints(
          data.player1Score,
          data.player2Score
        );

        // Apply bonus points to performances
        for (const perf of data.performances) {
          const isWinner = perf.playerId === winner;

          if (isWinner && bonusPoints > 0) {
            // Add bonus points to winner's performance
            await tx.matchPerformance.update({
              where: {
                matchId_playerId: {
                  matchId,
                  playerId: perf.playerId,
                },
              },
              data: {
                points: {
                  increment: bonusPoints,
                },
                otherStats: {
                  ...perf.otherStats,
                  bonusPoints,
                },
              },
            });
          }
        }

        // Update fantasy points
        await FantasyService.updatePointsAfterMatch(matchId);

        return completedMatch;
      });
    } catch (error) {
      console.error(`Error completing match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate bonus points based on match rules
   */
  private static calculateBonusPoints(
    player1Score: number,
    player2Score: number
  ): number {
    const winningScore = Math.max(player1Score, player2Score);
    const losingScore = Math.min(player1Score, player2Score);

    // If a player wins by 11-0, they get 15 bonus points
    if (winningScore === 11 && losingScore === 0) {
      return 15;
    }

    // If they win by under 5 points, they get 10 bonus points
    if (winningScore - losingScore < 5) {
      return 10;
    }

    return 0;
  }

  /**
   * Update player statistics after a match
   */
  private static async updatePlayerStats(
    tx: Prisma.TransactionClient,
    tournamentId: number,
    playerId: number,
    isWinner: boolean
  ) {
    // Check if stats exist for this player and tournament
    const existingStats = await tx.playerStats.findFirst({
      where: {
        playerId,
        tournamentId,
      },
    });

    if (existingStats) {
      // Update existing stats
      await tx.playerStats.update({
        where: { id: existingStats.id },
        data: {
          wins: { increment: isWinner ? 1 : 0 },
          losses: { increment: isWinner ? 0 : 1 },
        },
      });
    } else {
      // Create new stats
      await tx.playerStats.create({
        data: {
          player: { connect: { id: playerId } },
          tournament: { connect: { id: tournamentId } },
          wins: isWinner ? 1 : 0,
          losses: isWinner ? 0 : 1,
        },
      });
    }

    // Update global player stats
    await tx.player.update({
      where: { id: playerId },
      data: {
        tournamentWins: isWinner ? { increment: 1 } : undefined,
      },
    });
  }

  /**
   * Get live matches
   */
  static async getLiveMatches() {
    try {
      return await prisma.match.findMany({
        where: {
          status: "IN_PROGRESS",
        },
        include: {
          tournament: true,
          player1: true,
          player2: true,
          referee: true,
        },
        orderBy: {
          startTime: "asc",
        },
      });
    } catch (error) {
      console.error("Error fetching live matches:", error);
      throw error;
    }
  }

  /**
   * Get match with full details
   */
  static async getMatchWithDetails(id: number) {
    try {
      return await prisma.match.findUnique({
        where: { id },
        include: {
          tournament: true,
          player1: true,
          player2: true,
          referee: true,
          team1: true,
          team2: true,
          performances: {
            include: {
              player: true,
            },
          },
          playerPoints: {
            include: {
              player: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching match details for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Generate leaderboard from match results
   */
  static async generateLeaderboard(tournamentId: number) {
    try {
      const playerStats = await prisma.playerStats.findMany({
        where: {
          tournamentId,
        },
        include: {
          player: true,
        },
        orderBy: [{ wins: "desc" }, { pointsScored: "desc" }],
      });

      return playerStats;
    } catch (error) {
      console.error(
        `Error generating leaderboard for tournament ${tournamentId}:`,
        error
      );
      throw error;
    }
  }
}
