import prisma from "@/lib/db";
import {
  Prisma,
  TournamentType,
  TournamentStatus,
  MatchStatus,
  PaymentStatus,
} from "@prisma/client";

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(data: Prisma.TournamentCreateInput) {
    try {
      return await prisma.tournament.create({ data });
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  }

  /**
   * Get a tournament by ID with related data
   */
  static async getTournamentById(id: number) {
    try {
      return await prisma.tournament.findUnique({
        where: { id },
        include: {
          matches: {
            include: {
              player1: true,
              player2: true,
              referee: true,
            },
          },
          // Remove or update 'contests' if it is not defined in your Prisma schema
          // contests: true,
          playerStats: {
            include: { player: true },
          },
          entries: {
            include: { player: true },
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching tournament with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * List tournaments with optional filtering
   */
  static async listTournaments({
    page = 1,
    limit = 10,
    status,
    search,
    type,
    orderBy = { startDate: "asc" },
  }: {
    page?: number;
    limit?: number;
    status?: TournamentStatus;
    search?: string;
    type?: TournamentType;
    orderBy?: Prisma.TournamentOrderByWithRelationInput;
  }) {
    try {
      const where: Prisma.TournamentWhereInput = {
        ...(status && { status }),
        ...(type && { type }),
        ...(search && {
          OR: [
            { name: { contains: search } }, // Removed mode option
            { location: { contains: search } }, // Removed mode option
          ],
        }),
      };

      const [tournaments, total] = await Promise.all([
        prisma.tournament.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          include: {
            _count: {
              select: {
                matches: true,
                entries: true,
                fantasyContests: true,
              },
            },
          },
        }),
        prisma.tournament.count({ where }),
      ]);

      return {
        tournaments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error listing tournaments:", error);
      throw error;
    }
  }

  /**
   * Update a tournament
   */
  static async updateTournament(
    id: number,
    data: Prisma.TournamentUpdateInput
  ) {
    try {
      return await prisma.tournament.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(`Error updating tournament with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a tournament
   */
  static async deleteTournament(id: number) {
    try {
      await prisma.tournament.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error(`Error deleting tournament with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new match for a tournament
   */
  static async createMatch(data: Prisma.MatchCreateInput) {
    try {
      return await prisma.match.create({ data });
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    }
  }

  /**
   * List matches for a tournament
   */
  static async getTournamentMatches(
    tournamentId: number,
    options?: { round?: string; status?: MatchStatus }
  ) {
    try {
      const where: Prisma.MatchWhereInput = {
        tournamentId,
        ...(options?.round && { round: options.round }),
        ...(options?.status && { status: options.status }),
      };

      return await prisma.match.findMany({
        where,
        include: {
          player1: true,
          player2: true,
          referee: true,
          team1: true,
          team2: true,
          winner: true,
        },
        orderBy: { scheduledTime: "asc" },
      });
    } catch (error) {
      console.error(
        `Error fetching matches for tournament ${tournamentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update match details, including scores
   */
  static async updateMatch(id: number, data: Prisma.MatchUpdateInput) {
    try {
      return await prisma.match.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(`Error updating match with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Register a player for a tournament
   */
  static async registerPlayerForTournament(
    tournamentId: number,
    playerId: number
  ) {
    try {
      const entry = await prisma.tournamentEntry.create({
        data: {
          tournament: { connect: { id: tournamentId } },
          player: { connect: { id: playerId } },
          paymentStatus: "PENDING",
        },
        include: {
          tournament: true,
          player: true,
        },
      });
      return entry;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new Error("Player is already registered for this tournament");
        }
      }
      console.error("Error registering player for tournament:", error);
      throw error;
    }
  }

  /**
   * Update tournament entry payment status
   */
  static async updateEntryPaymentStatus(
    tournamentId: number,
    playerId: number,
    status: PaymentStatus
  ) {
    try {
      return await prisma.tournamentEntry.update({
        where: {
          tournamentId_playerId: {
            tournamentId,
            playerId,
          },
        },
        data: { paymentStatus: status },
      });
    } catch (error) {
      console.error("Error updating entry payment status:", error);
      throw error;
    }
  }
}
