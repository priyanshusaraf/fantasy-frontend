import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authMiddleware } from "@/middleware/auth";
import { validateRegistration } from "@/utils/validation";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/tournaments
 * Get all tournaments or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const searchQuery = searchParams.get("q");

    // Validate pagination
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        {
          message: "Invalid pagination parameters",
        },
        { status: 400 }
      );
    }

    // Build filter conditions
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { location: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Get tournaments with pagination
    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          entries: true,
          matches: true,
          fantasyContests: true,
          tournamentAdmin: {
            include: {
              user: {
                select: {
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { startDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tournament.count({ where }),
    ]);

    // Calculate additional metadata
    const tournamentsWithMeta = tournaments.map((tournament) => ({
      ...tournament,
      totalEntries: tournament.entries.length,
      totalMatches: tournament.matches.length,
      registrationOpen:
        new Date() >= tournament.registrationOpenDate &&
        new Date() <= tournament.registrationCloseDate,
      daysUntilStart: Math.ceil(
        (tournament.startDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json(
      {
        tournaments: tournamentsWithMeta,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return errorHandler(error, request);
  }
}

/**
 * POST /api/tournaments
 * Create a new tournament
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Get current user from auth middleware
    const { user } = request;

    // Only admin, tournament_admin and master_admin can create tournaments
    if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          message: "Not authorized to create tournaments",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const tournamentData = await request.json();

    // Basic validation
    if (
      !tournamentData.name ||
      !tournamentData.startDate ||
      !tournamentData.endDate ||
      !tournamentData.location
    ) {
      return NextResponse.json(
        {
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Find the tournament admin record for the current user
    const adminRecord = await prisma.tournamentAdmin.findUnique({
      where: { userId: user.id },
    });

    if (!adminRecord) {
      return NextResponse.json(
        {
          message: "Tournament admin record not found",
        },
        { status: 404 }
      );
    }

    // Create the tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: tournamentData.name,
        description: tournamentData.description || "",
        type: tournamentData.type,
        status: "DRAFT",
        startDate: new Date(tournamentData.startDate),
        endDate: new Date(tournamentData.endDate),
        registrationOpenDate: new Date(tournamentData.registrationOpenDate),
        registrationCloseDate: new Date(tournamentData.registrationCloseDate),
        location: tournamentData.location,
        imageUrl: tournamentData.imageUrl,
        maxParticipants: tournamentData.maxParticipants || 32,
        entryFee: tournamentData.entryFee || 0,
        prizeMoney: tournamentData.prizeMoney || 0,
        organizerId: adminRecord.id,
        rules: tournamentData.rules || "",
      },
    });

    // Create fantasy contests if provided
    if (
      tournamentData.contestTypes &&
      Array.isArray(tournamentData.contestTypes)
    ) {
      const activeContests = tournamentData.contestTypes.filter(
        (contest: any) => contest.active
      );

      await Promise.all(
        activeContests.map((contest: any) => {
          return prisma.fantasyContest.create({
            data: {
              name: contest.name,
              tournamentId: tournament.id,
              entryFee: contest.entryFee || 0,
              prizePool: contest.entryFee * 0.8 || 0, // 80% of entry fee goes to prize pool
              maxEntries: tournamentData.maxParticipants || 100,
              currentEntries: 0,
              startDate: new Date(tournamentData.startDate),
              endDate: new Date(tournamentData.endDate),
              status: "UPCOMING",
              description: `${contest.name} fantasy contest for ${tournamentData.name}`,
              rules: JSON.stringify({
                walletSize: tournamentData.walletSize || 100000,
                fantasyTeamSize: tournamentData.fantasyTeamSize || 7,
                allowTeamChanges: tournamentData.allowTeamChanges || false,
                changeFrequency: tournamentData.changeFrequency || "daily",
                maxPlayersToChange: tournamentData.maxPlayersToChange || 2,
                changeWindowStart: tournamentData.changeWindowStart || "18:00",
                changeWindowEnd: tournamentData.changeWindowEnd || "22:00",
                playerCategories: tournamentData.playerCategories || [],
              }),
            },
          });
        })
      );
    }

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    return errorHandler(error, request);
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
  } catch (error) {
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
  } catch (error) {
    return errorHandler(error, request);
  }
}
