import prisma from "@/lib/prisma";

/**
 * Service responsible for calculating fantasy points for players and teams
 */
export class ScoringService {
  /**
   * Calculate fantasy points for a match score update
   * @param matchId - The ID of the match
   * @param teamId - The ID of the team that scored
   * @param points - The number of points scored
   */
  static async calculatePointsForMatchUpdate(
    matchId: number,
    teamId: number,
    points: number = 1
  ): Promise<{ [playerId: number]: number }> {
    try {
      // Get match details with players
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
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
        },
      });

      if (!match) {
        throw new Error(`Match not found: ${matchId}`);
      }

      // Determine which team's players get points
      const team = match.team1Id === teamId ? match.team1 : match.team2;
      
      // Base points for each player on the team
      const playerPoints: { [playerId: number]: number } = {};
      
      // Calculate points for each player (can be customized based on role, etc.)
      if (team.players && team.players.length > 0) {
        team.players.forEach((player) => {
          // Basic scoring: 1 point per match point
          playerPoints[player.id] = points;
        });
      }
      
      return playerPoints;
    } catch (error) {
      console.error(`Error calculating points for match update:`, error);
      return {};
    }
  }
  
  /**
   * Calculate fantasy points for match completion
   * @param matchId - The ID of the completed match
   */
  static async calculatePointsForMatchCompletion(
    matchId: number
  ): Promise<{ [playerId: number]: number }> {
    try {
      // Get match details with players
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
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
        },
      });

      if (!match) {
        throw new Error(`Match not found: ${matchId}`);
      }

      // Determine winning team
      const team1Won = match.team1Score > match.team2Score;
      const winningTeam = team1Won ? match.team1 : match.team2;
      const losingTeam = team1Won ? match.team2 : match.team1;
      
      const playerPoints: { [playerId: number]: number } = {};
      
      // Points for winning team players
      if (winningTeam.players && winningTeam.players.length > 0) {
        winningTeam.players.forEach((player) => {
          // Example scoring: 5 points for winning a match
          playerPoints[player.id] = 5;
        });
      }
      
      // Points for losing team players
      if (losingTeam.players && losingTeam.players.length > 0) {
        losingTeam.players.forEach((player) => {
          // Example scoring: 1 point for participation
          playerPoints[player.id] = 1;
        });
      }
      
      return playerPoints;
    } catch (error) {
      console.error(`Error calculating points for match completion:`, error);
      return {};
    }
  }
  
  /**
   * Update fantasy team points based on player points
   * @param contestId - The ID of the fantasy contest
   * @param playerPoints - Object mapping player IDs to points earned
   */
  static async updateFantasyTeamPoints(
    contestId: number,
    playerPoints: { [playerId: number]: number }
  ): Promise<void> {
    try {
      // Get all fantasy teams for this contest that include any of the affected players
      const playerIds = Object.keys(playerPoints).map(id => parseInt(id));
      
      const fantasyTeams = await prisma.fantasyTeam.findMany({
        where: {
          contestId,
          players: {
            some: {
              playerId: {
                in: playerIds,
              },
            },
          },
        },
        include: {
          players: true,
        },
      });
      
      // Update each fantasy team's points
      for (const team of fantasyTeams) {
        let teamPointsEarned = 0;
        
        // Calculate points earned for this team based on player roles
        for (const teamPlayer of team.players) {
          if (playerPoints[teamPlayer.playerId]) {
            let playerPointsEarned = playerPoints[teamPlayer.playerId];
            
            // Apply multiplier based on captain/vice-captain
            if (teamPlayer.isCaptain) {
              playerPointsEarned *= 2; // Captain gets 2x points
            } else if (teamPlayer.isViceCaptain) {
              playerPointsEarned *= 1.5; // Vice-captain gets 1.5x points
            }
            
            teamPointsEarned += playerPointsEarned;
          }
        }
        
        // Update team points in the database
        if (teamPointsEarned > 0) {
          await prisma.fantasyTeam.update({
            where: { id: team.id },
            data: {
              points: {
                increment: teamPointsEarned,
              },
            },
          });
        }
      }
    } catch (error) {
      console.error(`Error updating fantasy team points:`, error);
    }
  }
  
  /**
   * Calculate and update all fantasy points for a match score update
   * @param matchId - The ID of the match
   * @param teamId - The ID of the team that scored
   * @param contestId - The ID of the fantasy contest
   * @param points - The number of points scored
   */
  static async processMatchScoreUpdate(
    matchId: number,
    teamId: number,
    contestId: number,
    points: number = 1
  ): Promise<void> {
    try {
      // Calculate fantasy points for players
      const playerPoints = await this.calculatePointsForMatchUpdate(
        matchId,
        teamId,
        points
      );
      
      // Update fantasy team points
      await this.updateFantasyTeamPoints(contestId, playerPoints);
    } catch (error) {
      console.error(`Error processing match score update:`, error);
    }
  }
  
  /**
   * Calculate and update all fantasy points for a completed match
   * @param matchId - The ID of the completed match
   * @param contestId - The ID of the fantasy contest
   */
  static async processMatchCompletion(
    matchId: number,
    contestId: number
  ): Promise<void> {
    try {
      // Calculate fantasy points for players
      const playerPoints = await this.calculatePointsForMatchCompletion(matchId);
      
      // Update fantasy team points
      await this.updateFantasyTeamPoints(contestId, playerPoints);
    } catch (error) {
      console.error(`Error processing match completion:`, error);
    }
  }
} 