// src/lib/services/player-service.ts
import prisma from "../prisma";
import { Prisma } from "@prisma/client";

export class PlayerService {
  /**
   * Create a new player
   */
  static async createPlayer(data: Prisma.PlayerCreateInput) {
    try {
      return await prisma.player.create({
        data,
      });
    } catch (error) {
      console.error("Error creating player:", error);
      throw error;
    }
  }

  /**
   * Get a player by ID
   */
  static async getPlayerById(id: number) {
    try {
      return await prisma.player.findUnique({
        where: { id },
        include: {
          stats: {
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
          matchPerformances: {
            include: {
              match: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching player with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * List players with optional filtering
   */
  static async listPlayers({
    page = 1,
    limit = 10,
    isActive,
    country,
    search,
    skillLevel,
    orderBy = { rank: "asc" },
  }: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    country?: string;
    search?: string;
    skillLevel?: Prisma.PlayerSkillLevel;
    orderBy?: Prisma.PlayerOrderByWithRelationInput;
  }) {
    try {
      const where: Prisma.PlayerWhereInput = {
        ...(isActive !== undefined && { isActive }),
        ...(country && { country }),
        ...(skillLevel && { skillLevel }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { country: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const [players, total] = await Promise.all([
        prisma.player.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
        }),
        prisma.player.count({ where }),
      ]);

      return {
        players,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error listing players:", error);
      throw error;
    }
  }

  /**
   * Update a player
   */
  static async updatePlayer(id: number, data: Prisma.PlayerUpdateInput) {
    try {
      return await prisma.player.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(`Error updating player with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a player
   */
  static async deletePlayer(id: number) {
    try {
      await prisma.player.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error(`Error deleting player with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add player statistics
   */
  static async addPlayerStats(data: Prisma.PlayerStatsCreateInput) {
    try {
      return await prisma.playerStats.create({
        data,
      });
    } catch (error) {
      console.error("Error adding player stats:", error);
      throw error;
    }
  }

  /**
   * Get player statistics
   */
  static async getPlayerStats(playerId: number) {
    try {
      return await prisma.playerStats.findMany({
        where: { playerId },
        include: {
          tournament: true,
        },
      });
    } catch (error) {
      console.error(`Error fetching stats for player ${playerId}:`, error);
      throw error;
    }
  }
}
