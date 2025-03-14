import prisma from "@/lib/db";
import {
  FantasyTeam,
  FantasyTeamPlayer,
  FantasyContest,
  Player,
} from "@prisma/client";

interface CreateTeamParams {
  userId: number;
  contestId: number;
  name: string;
  players: {
    playerId: number;
    isCaptain: boolean;
    isViceCaptain: boolean;
  }[];
}

interface UpdateTeamParams {
  teamId: number;
  name?: string;
  players?: {
    playerId: number;
    isCaptain: boolean;
    isViceCaptain: boolean;
  }[];
}

interface FantasyTeamWithDetails extends FantasyTeam {
  players: (FantasyTeamPlayer & {
    player: Player;
  })[];
  contest: FantasyContest & {
    tournament: {
      name: string;
      startDate: Date;
      endDate: Date;
    };
  };
}

class FantasyTeamService {
  /**
   * Create a new fantasy team
   */
  async createTeam(params: CreateTeamParams): Promise<FantasyTeam> {
    const { userId, contestId, name, players } = params;

    // Validate contest
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      include: {
        tournament: {
          select: {
            startDate: true,
            status: true,
          },
        },
      },
    });

    if (!contest) {
      throw new Error("Contest not found");
    }

    // Check if contest is open for team creation
    if (contest.status !== "UPCOMING") {
      throw new Error("Contest is not open for team creation");
    }

    // Check if tournament has started
    if (new Date() > contest.tournament.startDate) {
      throw new Error("Tournament has already started");
    }

    // Check if user already has a team in this contest
    const existingTeam = await prisma.fantasyTeam.findFirst({
      where: {
        userId,
        contestId,
      },
    });

    if (existingTeam) {
      throw new Error("You already have a team in this contest");
    }

    // Get contest rules
    let rules: any = {};
    try {
      rules = JSON.parse(contest.rules || "{}");
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }

    const teamSize = rules.fantasyTeamSize || 7;

    // Validate player count
    if (players.length !== teamSize) {
      throw new Error(`You must select exactly ${teamSize} players`);
    }

    // Validate captain and vice-captain
    const captains = players.filter((p) => p.isCaptain);
    const viceCaptains = players.filter((p) => p.isViceCaptain);

    if (captains.length !== 1) {
      throw new Error("You must select exactly one captain");
    }

    if (viceCaptains.length !== 1) {
      throw new Error("You must select exactly one vice-captain");
    }

    if (captains[0].playerId === viceCaptains[0].playerId) {
      throw new Error("Captain and vice-captain must be different players");
    }

    // Validate wallet size
    const walletSize = rules.walletSize || 100000;

    // Get players with their prices
    const playerIds = players.map((p) => p.playerId);
    const playerRecords = await prisma.player.findMany({
      where: {
        id: {
          in: playerIds,
        },
      },
    });

    // Calculate total cost
    let totalCost = 0;

    for (const player of playerRecords) {
      // Calculate player price based on rank or use default
      const price = player.rank ? Math.max(1000 / player.rank, 500) : 500;
      totalCost += price;
    }

    if (totalCost > walletSize) {
      throw new Error("Team cost exceeds wallet size");
    }

    // Create team and players in a transaction
    return await prisma.$transaction(async (tx) => {
      // Create fantasy team
      const team = await tx.fantasyTeam.create({
        data: {
          name,
          userId,
          contestId,
          totalPoints: 0,
        },
      });

      // Add players to team
      await Promise.all(
        players.map((player) => {
          return tx.fantasyTeamPlayer.create({
            data: {
              teamId: team.id,
              playerId: player.playerId,
              isCaptain: player.isCaptain,
              isViceCaptain: player.isViceCaptain,
            },
          });
        })
      );

      // Update contest count
      await tx.fantasyContest.update({
        where: { id: contestId },
        data: {
          currentEntries: {
            increment: 1,
          },
        },
      });

      return team;
    });
  }

  /**
   * Get fantasy team details
   */
  async getTeam(teamId: number): Promise<FantasyTeamWithDetails | null> {
    return prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        contest: {
          include: {
            tournament: {
              select: {
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: number): Promise<FantasyTeamWithDetails[]> {
    return prisma.fantasyTeam.findMany({
      where: { userId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        contest: {
          include: {
            tournament: {
              select: {
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get all teams for a contest
   */
  async getContestTeams(contestId: number): Promise<FantasyTeam[]> {
    return prisma.fantasyTeam.findMany({
      where: { contestId },
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
      orderBy: {
        totalPoints: "desc",
      },
    });
  }

  /**
   * Update fantasy team
   */
  async updateTeam(params: UpdateTeamParams): Promise<FantasyTeam> {
    const { teamId, name, players } = params;

    // Get team with associated contest
    const team = await prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      include: {
        contest: {
          include: {
            tournament: {
              select: {
                startDate: true,
                endDate: true,
                status: true,
              },
            },
          },
        },
        players: true,
      },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Get contest rules
    let rules: any = {};
    try {
      rules = JSON.parse(team.contest.rules || "{}");
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }

    // Check if team changes are allowed
    if (!rules.allowTeamChanges) {
      throw new Error("Team changes are not allowed for this contest");
    }

    // Check if tournament has started and is not completed
    const now = new Date();
    if (now < team.contest.tournament.startDate) {
      // Tournament hasn't started yet - full edits allowed
      return this.updateTeamFull(teamId, name, players);
    } else if (
      now > team.contest.tournament.endDate ||
      team.contest.tournament.status === "COMPLETED"
    ) {
      // Tournament has ended
      throw new Error("Tournament has ended. Team changes are not allowed");
    } else {
      // Tournament is in progress - limited edits based on rules
      return this.updateTeamLimited(team, name, players, rules);
    }
  }

  /**
   * Full team update (before tournament starts)
   */
  private async updateTeamFull(
    teamId: number,
    name?: string,
    players?: any[]
  ): Promise<FantasyTeam> {
    return prisma.$transaction(async (tx) => {
      // Update team name if provided
      if (name) {
        await tx.fantasyTeam.update({
          where: { id: teamId },
          data: { name },
        });
      }

      // Update players if provided
      if (players && players.length > 0) {
        // Delete existing players
        await tx.fantasyTeamPlayer.deleteMany({
          where: { teamId },
        });

        // Add new players
        await Promise.all(
          players.map((player) => {
            return tx.fantasyTeamPlayer.create({
              data: {
                teamId,
                playerId: player.playerId,
                isCaptain: player.isCaptain,
                isViceCaptain: player.isViceCaptain,
              },
            });
          })
        );
      }

      // Return updated team
      return tx.fantasyTeam.findUnique({
        where: { id: teamId },
        include: {
          players: {
            include: {
              player: true,
            },
          },
        },
      }) as Promise<FantasyTeam>;
    });
  }

  /**
   * Limited team update (during tournament)
   */
  private async updateTeamLimited(
    team: any,
    name?: string,
    players?: any[],
    rules?: any
  ): Promise<FantasyTeam> {
    // Check if update is within change window times
    const now = new Date();
    const timeString =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    if (rules.changeWindowStart && rules.changeWindowEnd) {
      if (
        timeString < rules.changeWindowStart ||
        timeString > rules.changeWindowEnd
      ) {
        throw new Error(
          `Team changes are only allowed between ${rules.changeWindowStart} and ${rules.changeWindowEnd}`
        );
      }
    }

    // Check change frequency
    if (rules.changeFrequency === "once") {
      // Check if team has been updated before
      if (team.updatedAt > team.contest.tournament.startDate) {
        throw new Error(
          "You can only change your team once during the tournament"
        );
      }
    } else if (rules.changeFrequency === "rounds") {
      // Would need tournament round info to implement this properly
      // For now, just allow the change
    }
    // For 'daily' frequency, no additional checks needed

    return prisma.$transaction(async (tx) => {
      // Update team name if provided
      if (name) {
        await tx.fantasyTeam.update({
          where: { id: team.id },
          data: { name },
        });
      }

      // Update players if provided
      if (players && players.length > 0) {
        // Get existing players
        const existingPlayers = team.players;

        // Check how many players are being changed
        const maxChanges = rules.maxPlayersToChange || 2;
        const existingPlayerIds = new Set(
          existingPlayers.map((p: any) => p.playerId)
        );
        const newPlayerIds = new Set(players.map((p) => p.playerId));

        // Count differences
        let changeCount = 0;
        for (const id of newPlayerIds) {
          if (!existingPlayerIds.has(id)) {
            changeCount++;
          }
        }

        if (changeCount > maxChanges) {
          throw new Error(
            `You can only change up to ${maxChanges} players at a time`
          );
        }

        // Delete existing players
        await tx.fantasyTeamPlayer.deleteMany({
          where: { teamId: team.id },
        });

        // Add new players
        await Promise.all(
          players.map((player) => {
            return tx.fantasyTeamPlayer.create({
              data: {
                teamId: team.id,
                playerId: player.playerId,
                isCaptain: player.isCaptain,
                isViceCaptain: player.isViceCaptain,
              },
            });
          })
        );
      }

      // Return updated team
      return tx.fantasyTeam.findUnique({
        where: { id: team.id },
        include: {
          players: {
            include: {
              player: true,
            },
          },
        },
      }) as Promise<FantasyTeam>;
    });
  }

  /**
   * Calculate and update fantasy points
   */
  async updateTeamPoints(matchId: number): Promise<void> {
    // Get match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            fantasyContests: true,
          },
        },
        performances: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!match || match.status !== "COMPLETED") {
      return;
    }

    // Get all fantasy contests for this tournament
    const contestIds = match.tournament.fantasyContests.map(
      (contest: any) => contest.id
    );

    // Get all teams for these contests
    const teams = await prisma.fantasyTeam.findMany({
      where: {
        contestId: {
          in: contestIds,
        },
      },
      include: {
        players: true,
      },
    });

    // Calculate points for each team
    for (const team of teams) {
      // Get player performances in the match
      const teamPlayerIds = team.players.map((p: any) => p.playerId);

      // Get performances for players in this team
      const relevantPerformances = match.performances.filter((perf: any) =>
        teamPlayerIds.includes(perf.playerId)
      );

      let totalPoints = 0;

      // Calculate points for each player in the team
      for (const performance of relevantPerformances) {
        const teamPlayer = team.players.find(
          (p: any) => p.playerId === performance.playerId
        );
        if (!teamPlayer) continue;

        // Calculate base points
        let playerPoints = performance.points;

        // Add bonus points
        playerPoints += performance.aces || 0;
        playerPoints += performance.winningShots || 0;
        playerPoints -= performance.faults || 0;

        // Add bonus points for winning teams
        if (match.winnerId) {
          const isWinner = match.performances.some(
            (p: any) =>
              p.playerId === performance.playerId &&
              (
                (p.player as any).teamMembershipsIds as number[] | undefined
              )?.includes(match.winnerId)
          );

          if (isWinner) {
            // Check winning margin
            const winnerScore = Math.max(
              match.player1Score || 0,
              match.player2Score || 0
            );
            const loserScore = Math.min(
              match.player1Score || 0,
              match.player2Score || 0
            );

            if (loserScore === 0) {
              // 11-0 win: 15 extra points
              playerPoints += 15;
            } else if (winnerScore - loserScore >= 5) {
              // Win by 5 or more: 10 extra points
              playerPoints += 10;
            }
          }
        }

        // Apply captain/vice-captain multiplier
        if (teamPlayer.isCaptain) {
          playerPoints *= 2; // Captain gets 2x points
        } else if (teamPlayer.isViceCaptain) {
          playerPoints *= 1.5; // Vice-captain gets 1.5x points
        }

        // Add to total
        totalPoints += playerPoints;

        // Store player's points for this match
        await prisma.playerMatchPoints.create({
          data: {
            playerId: performance.playerId,
            matchId: match.id,
            points: playerPoints,
            breakdown: performance,
          },
        });
      }

      // Update team points
      await prisma.fantasyTeam.update({
        where: { id: team.id },
        data: {
          totalPoints: {
            increment: totalPoints,
          },
        },
      });
    }

    // Update contest rankings
    for (const contestId of contestIds) {
      // Get teams ordered by points
      const rankedTeams = await prisma.fantasyTeam.findMany({
        where: { contestId },
        orderBy: { totalPoints: "desc" },
      });

      // Update rankings
      await Promise.all(
        rankedTeams.map((team, index) => {
          return prisma.fantasyTeam.update({
            where: { id: team.id },
            data: { rank: index + 1 },
          });
        })
      );
    }
  }
}

export default FantasyTeamService;
