// src/lib/services/fantasy-service.ts
import prisma from "../../../prisma";
import { Prisma } from "@prisma/client";

export class FantasyService {
  /**
   * Create a new fantasy contest for a tournament
   */
  static async createContest(data: Prisma.FantasyContestCreateInput) {
    try {
      return await prisma.fantasyContest.create({
        data,
      });
    } catch (error) {
      console.error("Error creating fantasy contest:", error);
      throw error;
    }
  }

  static async getContestById(id: number) {
    try {
      return await prisma.fantasyContest.findUnique({
        where: { id },
        include: {
          tournament: true,
          teams: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
              _count: {
                select: {
                  players: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching contest with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * List all contests with optional filtering
   */
  static async listContests({
    page = 1,
    limit = 10,
    status,
    tournamentId,
    search,
  }: {
    page?: number;
    limit?: number;
    status?: Prisma.ContestStatus;
    tournamentId?: number;
    search?: string;
  }) {
    try {
      const where: Prisma.FantasyContestWhereInput = {
        ...(status && { status }),
        ...(tournamentId && { tournamentId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { tournament: { name: { contains: search, mode: "insensitive" } } },
          ],
        }),
      };

      const [contests, total] = await Promise.all([
        prisma.fantasyContest.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { startDate: "asc" },
          include: {
            tournament: true,
            _count: { select: { teams: true } },
          },
        }),
        prisma.fantasyContest.count({ where }),
      ]);

      return {
        contests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error listing contests:", error);
      throw error;
    }
  }

  /**
   * Create a new fantasy team for a user in a contest
   */
  static async createTeam(data: {
    userId: number;
    contestId: number;
    name: string;
    players: Array<{
      playerId: number;
      isCaptain?: boolean;
      isViceCaptain?: boolean;
    }>;
  }) {
    try {
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Check if the contest exists and has space
        const contest = await tx.fantasyContest.findUnique({
          where: { id: data.contestId },
        });

        if (!contest) {
          throw new Error("Contest not found");
        }

        if (contest.currentEntries >= contest.maxEntries) {
          throw new Error("Contest is full");
        }

        // Check if user already has a team in this contest
        const existingTeam = await tx.fantasyTeam.findFirst({
          where: {
            userId: data.userId,
            contestId: data.contestId,
          },
        });

        if (existingTeam) {
          throw new Error("You already have a team in this contest");
        }

        // Validate captain and vice-captain selections
        const captains = data.players.filter((p) => p.isCaptain);
        const viceCaptains = data.players.filter((p) => p.isViceCaptain);

        if (captains.length !== 1) {
          throw new Error("You must select exactly one captain");
        }

        if (viceCaptains.length !== 1) {
          throw new Error("You must select exactly one vice-captain");
        }

        if (captains[0].playerId === viceCaptains[0].playerId) {
          throw new Error("Captain and vice-captain must be different players");
        }

        // Create the team with players
        const team = await tx.fantasyTeam.create({
          data: {
            name: data.name,
            user: { connect: { id: data.userId } },
            contest: { connect: { id: data.contestId } },
            players: {
              create: data.players.map((player) => ({
                player: { connect: { id: player.playerId } },
                isCaptain: player.isCaptain || false,
                isViceCaptain: player.isViceCaptain || false,
              })),
            },
          },
          include: {
            players: {
              include: {
                player: true,
              },
            },
          },
        });

        // Update contest entry count
        await tx.fantasyContest.update({
          where: { id: data.contestId },
          data: {
            currentEntries: { increment: 1 },
          },
        });

        return team;
      });
    } catch (error) {
      console.error("Error creating fantasy team:", error);
      throw error;
    }
  }

  /**
   * Get user's fantasy teams
   */
  static async getUserTeams(userId: number) {
    try {
      return await prisma.fantasyTeam.findMany({
        where: { userId },
        include: {
          contest: {
            include: {
              tournament: true,
            },
          },
          players: {
            include: {
              player: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      console.error(`Error fetching teams for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get a fantasy team by ID
   */
  static async getTeamById(id: number) {
    try {
      return await prisma.fantasyTeam.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          contest: {
            include: {
              tournament: true,
            },
          },
          players: {
            include: {
              player: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching team with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a fantasy team (e.g., change players during allowed window)
   */
  static async updateTeam(
    id: number,
    data: {
      name?: string;
      playerChanges?: Array<{
        addPlayerId?: number;
        removePlayerId?: number;
        isCaptain?: boolean;
        isViceCaptain?: boolean;
      }>;
    }
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the team with related data
        const team = await tx.fantasyTeam.findUnique({
          where: { id },
          include: {
            contest: true,
            players: true,
          },
        });

        if (!team) {
          throw new Error("Team not found");
        }

        // Update team name if provided
        if (data.name) {
          await tx.fantasyTeam.update({
            where: { id },
            data: { name: data.name },
          });
        }

        // Process player changes if provided
        if (data.playerChanges && data.playerChanges.length > 0) {
          for (const change of data.playerChanges) {
            // Remove player if specified
            if (change.removePlayerId) {
              await tx.fantasyTeamPlayer.deleteMany({
                where: {
                  teamId: id,
                  playerId: change.removePlayerId,
                },
              });
            }

            // Add player if specified
            if (change.addPlayerId) {
              await tx.fantasyTeamPlayer.create({
                data: {
                  team: { connect: { id } },
                  player: { connect: { id: change.addPlayerId } },
                  isCaptain: change.isCaptain || false,
                  isViceCaptain: change.isViceCaptain || false,
                },
              });
            }

            // Update captain/vice-captain status
            if (
              (change.isCaptain || change.isViceCaptain) &&
              !change.addPlayerId &&
              !change.removePlayerId
            ) {
              // Find the player ID from the change object
              const playerId = Object.keys(change).find(
                (key) =>
                  key !== "isCaptain" && key !== "isViceCaptain" && change[key]
              );

              if (playerId) {
                await tx.fantasyTeamPlayer.updateMany({
                  where: {
                    teamId: id,
                    playerId: parseInt(playerId),
                  },
                  data: {
                    isCaptain: change.isCaptain || false,
                    isViceCaptain: change.isViceCaptain || false,
                  },
                });
              }
            }
          }
        }

        // Return the updated team
        return await tx.fantasyTeam.findUnique({
          where: { id },
          include: {
            players: {
              include: {
                player: true,
              },
            },
          },
        });
      });
    } catch (error) {
      console.error(`Error updating team with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update fantasy points after a match
   */
  static async updatePointsAfterMatch(matchId: number) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the match with player performance data
        const match = await tx.match.findUnique({
          where: { id: matchId },
          include: {
            tournament: true,
            performances: {
              include: {
                player: true,
              },
            },
          },
        });

        if (!match) {
          throw new Error("Match not found");
        }

        // Get all fantasy contests for this tournament
        const contests = await tx.fantasyContest.findMany({
          where: {
            tournamentId: match.tournamentId,
            status: "IN_PROGRESS",
          },
        });

        // Process each contest
        for (const contest of contests) {
          // Get all teams in this contest with their players
          const teams = await tx.fantasyTeam.findMany({
            where: {
              contestId: contest.id,
            },
            include: {
              players: true,
            },
          });

          // Update points for each team
          for (const team of teams) {
            let teamPoints = 0;

            // Calculate points for each player in the team
            for (const teamPlayer of team.players) {
              // Find player's performance in this match
              const performance = match.performances.find(
                (p) => p.playerId === teamPlayer.playerId
              );

              if (performance) {
                let playerPoints = performance.points;

                // Apply captain/vice-captain multipliers
                if (teamPlayer.isCaptain) {
                  playerPoints *= 2;
                } else if (teamPlayer.isViceCaptain) {
                  playerPoints *= 1.5;
                }

                teamPoints += playerPoints;

                // Record player match points
                await tx.playerMatchPoints.create({
                  data: {
                    player: { connect: { id: teamPlayer.playerId } },
                    match: { connect: { id: matchId } },
                    points: playerPoints,
                    breakdown: {
                      basePoints: performance.points,
                      isCaptain: teamPlayer.isCaptain,
                      isViceCaptain: teamPlayer.isViceCaptain,
                      multiplier: teamPlayer.isCaptain
                        ? 2
                        : teamPlayer.isViceCaptain
                        ? 1.5
                        : 1,
                    },
                  },
                });
              }
            }

            // Update team total points
            await tx.fantasyTeam.update({
              where: { id: team.id },
              data: {
                totalPoints: {
                  increment: teamPoints,
                },
              },
            });
          }
        }

        return { success: true, matchId };
      });
    } catch (error) {
      console.error(`Error updating points after match ${matchId}:`, error);
      throw error;
    }
  }
}
