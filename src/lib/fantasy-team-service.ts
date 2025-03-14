// src/lib/fantasy-team-service.ts
import { connectToDatabase } from "./db";
import { FantasyTeam } from "./fantasy-pickleball";

export class FantasyTeamService {
  static async createTeam(teamData: Omit<FantasyTeam, "id" | "createdAt">) {
    const connection = await connectToDatabase();

    try {
      // Validate player selection rules
      await this.validateTeamSelection(teamData.players, teamData.leagueId);

      const newTeam: FantasyTeam = {
        ...teamData,
        totalPoints: 0,
        budget: 1000, // Starting budget
        transfersAvailable: 5,
        createdAt: new Date(),
      };

      const [result] = await connection.execute(
        `INSERT INTO fantasy_teams 
        (userId, teamName, players, totalPoints, budget, transfersAvailable, leagueId, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newTeam.userId,
          newTeam.teamName,
          JSON.stringify(newTeam.players),
          newTeam.totalPoints,
          newTeam.budget,
          newTeam.transfersAvailable,
          newTeam.leagueId,
          newTeam.createdAt,
        ]
      );

      return result;
    } catch (error) {
      console.error("Fantasy team creation error:", error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  static async validateTeamSelection(playerIds: string[], leagueId?: number) {
    // Implement team selection rules
    // e.g.,
    // - Maximum players
    // - Budget constraints
    // - Player position balance
  }
}
