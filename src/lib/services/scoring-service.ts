// src/lib/services/scoring-service.ts
import prisma from "@/lib/prisma";

interface MatchResult {
  matchId: number;
  player1Id: number;
  player2Id: number;
  player1Score: number;
  player2Score: number;
  isKnockout: boolean;
}

export class ScoringService {
  /**
   * Calculate points for a completed match
   */
  static async calculateMatchPoints(matchId: number) {
    // Get match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        player1: true,
        player2: true,
      },
    });

    if (!match || match.status !== "COMPLETED") {
      throw new Error("Match not found or not completed");
    }

    // Extract scores
    const player1Score = match.player1Score || 0;
    const player2Score = match.player2Score || 0;

    // Determine if this is a knockout match
    const isKnockout =
      match.round.toLowerCase().includes("final") ||
      match.round.toLowerCase().includes("semi") ||
      match.round.toLowerCase().includes("quarter");

    // Calculate points for each player
    const result: MatchResult = {
      matchId,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player1Score,
      player2Score,
      isKnockout,
    };

    const player1Points = this.calculatePlayerPoints(result, match.player1Id);
    const player2Points = this.calculatePlayerPoints(result, match.player2Id);

    // Store points in database
    await prisma.playerMatchPoints.upsert({
      where: {
        playerId_matchId: {
          playerId: match.player1Id,
          matchId,
        },
      },
      update: {
        points: player1Points,
        breakdown: JSON.stringify(
          this.getPointsBreakdown(result, match.player1Id)
        ),
      },
      create: {
        playerId: match.player1Id,
        matchId,
        points: player1Points,
        breakdown: JSON.stringify(
          this.getPointsBreakdown(result, match.player1Id)
        ),
      },
    });

    await prisma.playerMatchPoints.upsert({
      where: {
        playerId_matchId: {
          playerId: match.player2Id,
          matchId,
        },
      },
      update: {
        points: player2Points,
        breakdown: JSON.stringify(
          this.getPointsBreakdown(result, match.player2Id)
        ),
      },
      create: {
        playerId: match.player2Id,
        matchId,
        points: player2Points,
        breakdown: JSON.stringify(
          this.getPointsBreakdown(result, match.player2Id)
        ),
      },
    });

    // Update fantasy team points
    await this.updateFantasyTeamPoints(matchId);

    return {
      player1: {
        id: match.player1Id,
        name: match.player1.name,
        points: player1Points,
      },
      player2: {
        id: match.player2Id,
        name: match.player2.name,
        points: player2Points,
      },
    };
  }

  /**
   * Calculate points for a single player in a match
   */
  private static calculatePlayerPoints(
    result: MatchResult,
    playerId: number
  ): number {
    const isPlayer1 = playerId === result.player1Id;
    const playerScore = isPlayer1 ? result.player1Score : result.player2Score;
    const opponentScore = isPlayer1 ? result.player2Score : result.player1Score;

    // Base points - each player gets points equal to their score
    let points = playerScore;

    // Winning bonus
    const isWinner = playerScore > opponentScore;
    if (isWinner) {
      // Perfect game bonus (11-0)
      if (opponentScore === 0) {
        points += 15;
      }
      // Close game bonus (winning by less than 5 points)
      else if (playerScore - opponentScore < 5) {
        points += 10;
      }
    }

    // Knockout stage multiplier
    if (result.isKnockout) {
      points *= 1.5;
    }

    return points;
  }

  /**
   * Get detailed breakdown of points
   */
  private static getPointsBreakdown(
    result: MatchResult,
    playerId: number
  ): any {
    const isPlayer1 = playerId === result.player1Id;
    const playerScore = isPlayer1 ? result.player1Score : result.player2Score;
    const opponentScore = isPlayer1 ? result.player2Score : result.player1Score;

    const breakdown: any = {
      basePoints: playerScore,
      bonuses: {},
    };

    // Winning bonus
    const isWinner = playerScore > opponentScore;
    if (isWinner) {
      breakdown.bonuses.winningMatch = 0;

      // Perfect game bonus (11-0)
      if (opponentScore === 0) {
        breakdown.bonuses.perfectGame = 15;
      }
      // Close game bonus (winning by less than 5 points)
      else if (playerScore - opponentScore < 5) {
        breakdown.bonuses.closeGame = 10;
      }
    }

    // Knockout stage multiplier
    if (result.isKnockout) {
      breakdown.knockoutMultiplier = 1.5;
    } else {
      breakdown.knockoutMultiplier = 1;
    }

    // Calculate total with multiplier
    let total = playerScore;
    Object.values(breakdown.bonuses).forEach((bonus: any) => {
      total += bonus;
    });

    total *= breakdown.knockoutMultiplier;
    breakdown.total = total;

    return breakdown;
  }

  /**
   * Update all fantasy team points after a match
   */
  private static async updateFantasyTeamPoints(matchId: number) {
    // Get match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            fantasyContests: true,
          },
        },
      },
    });

    if (!match) return;

    // Get all contests affected by this match
    const contestIds = match.tournament.fantasyContests.map((c) => c.id);

    // For each contest, update all team points
    for (const contestId of contestIds) {
      await this.updateContestTeamPoints(contestId);
    }
  }

  /**
   * Update all team points in a contest
   */
  private static async updateContestTeamPoints(contestId: number) {
    // Get all teams in this contest
    const teams = await prisma.fantasyTeam.findMany({
      where: { contestId },
      include: {
        players: true,
      },
    });

    // Update each team's points
    for (const team of teams) {
      await this.updateTeamPoints(team.id);
    }

    // Update team rankings
    await this.updateTeamRankings(contestId);
  }

  /**
   * Update a single team's points
   */
  private static async updateTeamPoints(teamId: number) {
    // Get team details
    const team = await prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      include: {
        players: true,
        contest: {
          include: {
            tournament: true,
          },
        },
      },
    });

    if (!team) return;

    // Get tournament ID
    const tournamentId = team.contest.tournamentId;

    // Get player points for this tournament
    let totalPoints = 0;

    for (const teamPlayer of team.players) {
      const playerPoints = await prisma.playerMatchPoints.findMany({
        where: {
          playerId: teamPlayer.playerId,
          match: {
            tournamentId,
          },
        },
      });

      // Calculate player's total points with captain/vice-captain multipliers
      let playerTotalPoints = playerPoints.reduce(
        (sum, p) => sum + Number(p.points),
        0
      );

      // Apply captain/vice-captain multipliers
      if (teamPlayer.isCaptain) {
        playerTotalPoints *= 2;
      } else if (teamPlayer.isViceCaptain) {
        playerTotalPoints *= 1.5;
      }

      totalPoints += playerTotalPoints;
    }

    // Update team's total points
    await prisma.fantasyTeam.update({
      where: { id: teamId },
      data: {
        totalPoints,
      },
    });
  }

  /**
   * Update team rankings in a contest
   */
  private static async updateTeamRankings(contestId: number) {
    // Get all teams ordered by points
    const teams = await prisma.fantasyTeam.findMany({
      where: { contestId },
      orderBy: {
        totalPoints: "desc",
      },
    });

    // Update ranks
    for (let i = 0; i < teams.length; i++) {
      await prisma.fantasyTeam.update({
        where: { id: teams[i].id },
        data: {
          rank: i + 1,
        },
      });
    }
  }
}
