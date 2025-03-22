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
      return NextResponse.json({
        error: "Unauthorized",
        message: "You must be a tournament admin or master admin to create tournaments"
      }, { status: 401 });
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

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!type) missingFields.push("type");
    if (!startDate) missingFields.push("startDate");
    if (!endDate) missingFields.push("endDate");
    if (!location) missingFields.push("location");
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: "Validation Error",
        message: `Missing required fields: ${missingFields.join(", ")}`,
        fields: missingFields
      }, { status: 400 });
    }

    // Validate dates
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const regOpen = registrationOpenDate ? new Date(registrationOpenDate) : null;
      const regClose = registrationCloseDate ? new Date(registrationCloseDate) : null;
      
      if (end <= start) {
        return NextResponse.json({
          error: "Date Validation Error",
          message: "End date must be after start date"
        }, { status: 400 });
      }
      
      if (regOpen && regClose && regClose <= regOpen) {
        return NextResponse.json({
          error: "Date Validation Error",
          message: "Registration close date must be after registration open date"
        }, { status: 400 });
      }
    } catch (err) {
      return NextResponse.json({
        error: "Date Validation Error",
        message: "Invalid date format"
      }, { status: 400 });
    }

    // Get tournament admin ID
    const adminUser = await prisma.tournamentAdmin.findFirst({
      where: {
        user: {
          id: parseInt(session.user.id as string),
        },
      },
    });

    if (!adminUser) {
      return NextResponse.json({
        error: "Not Found",
        message: "Tournament admin profile not found. Please set up your admin profile first."
      }, { status: 404 });
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        type,
        isTeamBased: isTeamBased || false,
        status: 'IN_PROGRESS',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationOpenDate: registrationOpenDate ? new Date(registrationOpenDate) : new Date(startDate),
        registrationCloseDate: registrationCloseDate ? new Date(registrationCloseDate) : new Date(startDate),
        location,
        maxParticipants: Number(maxParticipants) || 32,
        entryFee: Number(entryFee) || 0,
        prizeMoney: prizeMoney ? Number(prizeMoney) : null,
        rules,
        fantasySettings: fantasySettings ? JSON.stringify(fantasySettings) : null,
        organizerId: adminUser.id,
      },
    });

    // Add players to tournament
    const playerResults = [];
    if (players && players.length > 0) {
      for (const player of players) {
        try {
          const entry = await prisma.tournamentEntry.create({
            data: {
              tournamentId: tournament.id,
              playerId: player.id,
              paymentStatus: 'PAID', // Auto-approve entries created by admin
            },
          });
          playerResults.push({ 
            playerId: player.id, 
            success: true, 
            entryId: entry.id 
          });
        } catch (playerError) {
          console.error(`Error adding player ${player.id} to tournament:`, playerError);
          playerResults.push({ 
            playerId: player.id,
            success: false,
            error: playerError instanceof Error ? playerError.message : "Unknown error" 
          });
        }
      }
    }

    // Create teams if team-based tournament
    const teamResults = [];
    if (isTeamBased && teams && teams.length > 0) {
      for (const team of teams) {
        try {
          const newTeam = await prisma.team.create({
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
          teamResults.push({ 
            teamId: newTeam.id, 
            name: team.name, 
            success: true 
          });
        } catch (teamError) {
          console.error(`Error creating team ${team.name} for tournament:`, teamError);
          teamResults.push({ 
            name: team.name,
            success: false,
            error: teamError instanceof Error ? teamError.message : "Unknown error" 
          });
        }
      }
    }

    // Return the created tournament with detailed results
    return NextResponse.json({
      tournament,
      players: playerResults.length > 0 ? playerResults : undefined,
      teams: teamResults.length > 0 ? teamResults : undefined,
      success: true,
      message: "Tournament created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorDetail = error instanceof Error && error.stack ? error.stack : undefined;
    
    return NextResponse.json({
      error: "Tournament Creation Failed",
      message: errorMessage,
      detail: errorDetail,
      success: false
    }, { status: 500 });
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
