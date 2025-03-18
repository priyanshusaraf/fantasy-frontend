import { PrismaClient } from "@prisma/client";
import {
  createValidationError,
  createDatabaseError,
} from "@/lib/utils/api-error";
import { FantasyTeamSchema } from "@/lib/db/schema";

const prisma = new PrismaClient();

export class FantasyTeamService {
  static async createTeam(input: {
    userId: number;
    teamName: string;
    players: number[];
    leagueId?: number;
  }) {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: { player: true },
      });

      if (!user || !user.player) {
        throw createValidationError("User or player profile not found", {
          userId: "Invalid user or player",
        });
      }

      // Validate selected players exist and are unique
      const playerValidation = await prisma.player.findMany({
        where: {
          id: { in: input.players },
          // Optional: Add more constraints like skill level, etc.
        },
      });

      if (playerValidation.length !== input.players.length) {
        throw createValidationError("Some selected players are invalid", {
          players: "One or more selected players do not exist",
        });
      }

      // Create fantasy team
      const fantasyTeam = await prisma.fantasyTeam.create({
        data: {
          name: input.teamName,
          playerId: user.player.id,
          selectedPlayers: {
            connect: input.players.map((id) => ({ id })),
          },
        },
        include: {
          owner: true,
          selectedPlayers: true,
        },
      });

      return fantasyTeam;
    } catch (error) {
      // Convert to appropriate error type
      if (error.code === "P2002") {
        // Unique constraint violation
        throw createValidationError("Team name must be unique", {
          teamName: "A team with this name already exists",
        });
      }

      throw createDatabaseError(
        error instanceof Error ? error.message : "Failed to create fantasy team"
      );
    }
  }

  static async getUserFantasyTeams(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          player: {
            include: {
              ownedFantasyTeams: {
                include: {
                  selectedPlayers: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.player) {
        throw createValidationError("User or player profile not found", {
          userId: "Invalid user or player",
        });
      }

      return user.player.ownedFantasyTeams;
    } catch (error) {
      throw createDatabaseError(
        error instanceof Error
          ? error.message
          : "Failed to retrieve fantasy teams"
      );
    }
  }

  static async updateFantasyTeam(
    teamId: number,
    userId: number,
    updateData: {
      teamName?: string;
      players?: number[];
    }
  ) {
    try {
      // Validate ownership
      const existingTeam = await prisma.fantasyTeam.findFirst({
        where: {
          id: teamId,
          playerId: userId,
        },
      });

      if (!existingTeam) {
        throw createValidationError("Team not found or unauthorized", {
          teamId: "Cannot update this team",
        });
      }

      // Validate players if provided
      if (updateData.players) {
        const playerValidation = await prisma.player.findMany({
          where: {
            id: { in: updateData.players },
          },
        });

        if (playerValidation.length !== updateData.players.length) {
          throw createValidationError("Some selected players are invalid", {
            players: "One or more selected players do not exist",
          });
        }
      }

      // Update team
      const updatedTeam = await prisma.fantasyTeam.update({
        where: { id: teamId },
        data: {
          ...(updateData.teamName && { name: updateData.teamName }),
          ...(updateData.players && {
            selectedPlayers: {
              set: updateData.players.map((id) => ({ id })),
            },
          }),
        },
        include: {
          selectedPlayers: true,
        },
      });

      return updatedTeam;
    } catch (error) {
      throw createDatabaseError(
        error instanceof Error ? error.message : "Failed to update fantasy team"
      );
    }
  }
}
