import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authMiddleware } from "@/middleware/auth";
import { validateRegistration } from "@/utils/validation";
import { errorHandler } from "@/middleware/error-handler";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Extend NextRequest to include user property
declare module "next/server" {
  interface NextRequest {
    user?: {
      id: number;
      role: string;
      email?: string;
      username?: string;
    };
  }
}

/**
 * GET /api/tournaments
 * Get all tournaments or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Optional authentication
    // If user is authenticated, we can show them additional info
    let userId: number | null = null;
    try {
      const authResult = await authMiddleware(request);
      if (authResult.status === 200) {
        userId = (request as any).user?.id || null;
      }
    } catch (error) {
      // Continue without user auth
      console.log("Non-authenticated request to tournaments");
    }

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const organizerId = url.searchParams.get("organizerId");

    // Build filter conditions
    const whereConditions: any = {};

    if (status) {
      whereConditions.status = status;
    }

    if (type) {
      whereConditions.type = type;
    }

    if (organizerId) {
      whereConditions.organizerId = parseInt(organizerId);
    }

    if (search) {
      whereConditions.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get tournaments from database
    const tournaments = await prisma.tournament.findMany({
      where: whereConditions,
      take: limit,
      orderBy: {
        startDate: "desc",
      },
      include: {
        tournamentAdmin: {
          include: {
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
        entries: true,
      },
    });

    // Get player counts for each tournament
    const tournamentsWithCounts = await Promise.all(
      tournaments.map(async (tournament) => {
        // Count players in the tournament
        const playerCount = await prisma.tournamentEntry.count({
          where: {
            tournamentId: tournament.id,
          },
        });

        // Format tournament data
        return {
          id: tournament.id,
          name: tournament.name,
          description: tournament.description,
          type: tournament.type,
          status: tournament.status,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          location: tournament.location,
          imageUrl: tournament.imageUrl,
          maxParticipants: tournament.maxParticipants,
          entryFee: tournament.entryFee,
          prizeMoney: tournament.prizeMoney,
          playerCount,
          organizer: tournament.tournamentAdmin?.user?.username || "Unknown",
          registrationOpen: 
            tournament.status === "REGISTRATION_OPEN" ||
            (tournament.registrationOpenDate <= new Date() && 
             tournament.registrationCloseDate >= new Date()),
          createdAt: tournament.createdAt,
          updatedAt: tournament.updatedAt,
        };
      })
    );

    return NextResponse.json({ tournaments: tournamentsWithCounts });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * POST /api/tournaments
 * Create a new tournament
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['TOURNAMENT_ADMIN', 'MASTER_ADMIN'].includes(session.user.role as string)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { 
      name, 
      description, 
      type, 
      isTeamBased, 
      startDate, 
      endDate, 
      registrationOpenDate, 
      registrationCloseDate, 
      location, 
      maxParticipants, 
      entryFee, 
      prizeMoney, 
      rules, 
      players, 
      teams,
      fantasySettings 
    } = body;

    // Get tournament admin ID
    const adminUser = await prisma.tournamentAdmin.findFirst({
      where: {
        user: {
          id: session.user.id,
        },
      },
    });

    if (!adminUser) {
      return new NextResponse('Tournament admin not found', { status: 404 });
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        type,
        isTeamBased: isTeamBased || false,
        status: 'DRAFT',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationOpenDate: new Date(registrationOpenDate),
        registrationCloseDate: new Date(registrationCloseDate),
        location,
        maxParticipants: Number(maxParticipants),
        entryFee: Number(entryFee),
        prizeMoney: prizeMoney ? Number(prizeMoney) : null,
        rules,
        fantasySettings: fantasySettings ? JSON.stringify(fantasySettings) : null,
        organizerId: adminUser.id,
      },
    });

    // Add players to tournament
    if (players && players.length > 0) {
      for (const player of players) {
        await prisma.tournamentEntry.create({
          data: {
            tournamentId: tournament.id,
            playerId: player.id,
            paymentStatus: 'PAID', // Auto-approve entries created by admin
          },
        });
      }
    }

    // Create teams if team-based tournament
    if (isTeamBased && teams && teams.length > 0) {
      for (const team of teams) {
        await prisma.team.create({
          data: {
            name: team.name,
            tournament: {
              connect: { id: tournament.id }
            },
            players: {
              connect: team.players.map((player: any) => ({ id: player.id }))
            }
          },
        });
      }
    }

    // Return the created tournament
    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    return new NextResponse('Error creating tournament', { status: 500 });
  }
}

/**
 * PUT /api/tournaments/:id
 * Update a tournament
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Get current user from auth middleware
    const { user } = request;

    // Only admin and tournament_admin can update tournaments
    if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          message: "Not authorized to update tournaments",
        },
        { status: 403 }
      );
    }

    // Parse request body and URL
    const tournamentData = await request.json();
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const tournamentId = parseInt(segments[segments.length - 1], 10);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        {
          message: "Invalid tournament ID",
        },
        { status: 400 }
      );
    }

    // Check if tournament exists and belongs to the user
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tournamentAdmin: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existingTournament) {
      return NextResponse.json(
        {
          message: "Tournament not found",
        },
        { status: 404 }
      );
    }

    // Check if user is the tournament admin or a master admin
    const isTournamentAdmin =
      existingTournament.tournamentAdmin.userId === user.id;
    const isMasterAdmin = user.role === "MASTER_ADMIN";

    if (!isTournamentAdmin && !isMasterAdmin) {
      return NextResponse.json(
        {
          message: "Not authorized to update this tournament",
        },
        { status: 403 }
      );
    }

    // Update the tournament
    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        name: tournamentData.name,
        description: tournamentData.description,
        type: tournamentData.type,
        status: tournamentData.status,
        startDate: tournamentData.startDate
          ? new Date(tournamentData.startDate)
          : undefined,
        endDate: tournamentData.endDate
          ? new Date(tournamentData.endDate)
          : undefined,
        registrationOpenDate: tournamentData.registrationOpenDate
          ? new Date(tournamentData.registrationOpenDate)
          : undefined,
        registrationCloseDate: tournamentData.registrationCloseDate
          ? new Date(tournamentData.registrationCloseDate)
          : undefined,
        location: tournamentData.location,
        imageUrl: tournamentData.imageUrl,
        maxParticipants: tournamentData.maxParticipants,
        entryFee: tournamentData.entryFee,
        prizeMoney: tournamentData.prizeMoney,
        rules: tournamentData.rules,
      },
    });

    return NextResponse.json(tournament, { status: 200 });
  } catch (error: any) {
    return errorHandler(error, request);
  }
}

/**
 * DELETE /api/tournaments/:id
 * Delete a tournament
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Get current user from auth middleware
    const { user } = request;

    // Only admin and tournament_admin can delete tournaments
    if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          message: "Not authorized to delete tournaments",
        },
        { status: 403 }
      );
    }

    // Parse URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const tournamentId = parseInt(segments[segments.length - 1], 10);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        {
          message: "Invalid tournament ID",
        },
        { status: 400 }
      );
    }

    // Check if tournament exists and belongs to the user
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tournamentAdmin: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existingTournament) {
      return NextResponse.json(
        {
          message: "Tournament not found",
        },
        { status: 404 }
      );
    }

    // Check if user is the tournament admin or a master admin
    const isTournamentAdmin =
      existingTournament.tournamentAdmin.userId === user.id;
    const isMasterAdmin = user.role === "MASTER_ADMIN";

    if (!isTournamentAdmin && !isMasterAdmin) {
      return NextResponse.json(
        {
          message: "Not authorized to delete this tournament",
        },
        { status: 403 }
      );
    }

    // Delete the tournament (this will cascade delete all related entities based on Prisma schema)
    await prisma.tournament.delete({
      where: { id: tournamentId },
    });

    return NextResponse.json(
      {
        message: "Tournament deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return errorHandler(error, request);
  }
}
