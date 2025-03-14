import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/fantasy-pickleball/contests
 * Get all contests or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const tournamentId = searchParams.get("tournamentId");

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

    if (tournamentId) {
      where.tournamentId = parseInt(tournamentId);
    }

    // Get contests with pagination
    const [contests, total] = await Promise.all([
      prisma.fantasyContest.findMany({
        where,
        include: {
          tournament: {
            select: {
              name: true,
              startDate: true,
              endDate: true,
              location: true,
              status: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              teams: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fantasyContest.count({ where }),
    ]);

    // Parse rules for each contest
    const contestsWithParsedRules = contests.map((contest) => {
      let rules = {};
      try {
        rules = JSON.parse(contest.rules || "{}");
      } catch (e) {
        console.error("Error parsing contest rules:", e);
      }

      return {
        ...contest,
        rules,
        participantCount: contest._count.teams,
      };
    });

    return NextResponse.json(
      {
        contests: contestsWithParsedRules,
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
 * POST /api/fantasy-pickleball/contests
 * Create a new fantasy contest
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

    // Only admin and tournament_admin can create contests
    if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          message: "Not authorized to create contests",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const contestData = await request.json();

    // Basic validation
    if (
      !contestData.name ||
      !contestData.tournamentId ||
      !contestData.startDate ||
      !contestData.endDate
    ) {
      return NextResponse.json(
        {
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Find the tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: contestData.tournamentId },
      include: {
        tournamentAdmin: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        {
          message: "Tournament not found",
        },
        { status: 404 }
      );
    }

    // Check if user is the tournament admin
    if (
      tournament.tournamentAdmin.userId !== user.id &&
      user.role !== "MASTER_ADMIN"
    ) {
      return NextResponse.json(
        {
          message: "Not authorized to create contests for this tournament",
        },
        { status: 403 }
      );
    }

    // Check dates
    if (
      new Date(contestData.startDate) < new Date(tournament.startDate) ||
      new Date(contestData.endDate) > new Date(tournament.endDate)
    ) {
      return NextResponse.json(
        {
          message: "Contest dates must be within tournament dates",
        },
        { status: 400 }
      );
    }

    // Format rules as JSON string
    const rules = JSON.stringify({
      walletSize: contestData.walletSize || 100000,
      fantasyTeamSize: contestData.fantasyTeamSize || 7,
      allowTeamChanges: contestData.allowTeamChanges || false,
      changeFrequency: contestData.changeFrequency || "daily",
      maxPlayersToChange: contestData.maxPlayersToChange || 2,
      changeWindowStart: contestData.changeWindowStart || "18:00",
      changeWindowEnd: contestData.changeWindowEnd || "22:00",
      playerCategories: contestData.playerCategories || [],
    });

    // Create the contest
    const contest = await prisma.fantasyContest.create({
      data: {
        name: contestData.name,
        tournamentId: contestData.tournamentId,
        entryFee: contestData.entryFee || 0,
        prizePool: contestData.prizePool || contestData.entryFee * 0.8 || 0, // 80% of entry fee goes to prize pool
        maxEntries: contestData.maxEntries || 100,
        currentEntries: 0,
        startDate: new Date(contestData.startDate),
        endDate: new Date(contestData.endDate),
        status: "UPCOMING",
        description: contestData.description || "",
        rules,
      },
    });

    return NextResponse.json(contest, { status: 201 });
  } catch (error) {
    return errorHandler(error, request);
  }
}

/**
 * GET /api/fantasy-pickleball/contests/:id
 * Get a specific contest by ID
 */
export async function GET_SPECIFIC(request: NextRequest) {
  try {
    // Parse URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const contestId = parseInt(segments[segments.length - 1], 10);

    if (isNaN(contestId)) {
      return NextResponse.json(
        {
          message: "Invalid contest ID",
        },
        { status: 400 }
      );
    }

    // Get contest
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            location: true,
            status: true,
            imageUrl: true,
          },
        },
        teams: {
          orderBy: {
            totalPoints: "desc",
          },
          take: 10,
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    if (!contest) {
      return NextResponse.json(
        {
          message: "Contest not found",
        },
        { status: 404 }
      );
    }

    // Parse rules
    let rules = {};
    try {
      rules = JSON.parse(contest.rules || "{}");
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }

    // Get players for this tournament with their fantasy prices
    const players = await prisma.player.findMany({
      where: {
        tournamentEntries: {
          some: {
            tournamentId: contest.tournamentId,
          },
        },
      },
      orderBy: {
        rank: "asc",
      },
    });

    // Calculate fantasy price for each player
    const playersWithPrices = players.map((player) => {
      // Find player category from rules
      let categoryPrice = 5000; // Default price
      if (rules.playerCategories && Array.isArray(rules.playerCategories)) {
        const category = player.skillLevel?.toLowerCase() || "";
        const categoryData = rules.playerCategories.find(
          (c: any) => c.name.toLowerCase() === category
        );

        if (categoryData) {
          categoryPrice = categoryData.price;
        }
      }

      // If no category found, calculate based on rank
      if (!categoryPrice && player.rank) {
        categoryPrice = Math.max(1000 / player.rank, 500);
      }

      return {
        ...player,
        fantasyPrice: categoryPrice,
      };
    });

    return NextResponse.json(
      {
        contest: {
          ...contest,
          rules,
          participantCount: contest._count.teams,
        },
        players: playersWithPrices,
      },
      { status: 200 }
    );
  } catch (error) {
    return errorHandler(error, request);
  }
}

/**
 * GET /api/fantasy-pickleball/contests/:id/players
 * Get players available for a contest
 */
export async function GET_PLAYERS(request: NextRequest) {
  try {
    // Parse URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const contestId = parseInt(segments[segments.length - 2], 10);

    if (isNaN(contestId)) {
      return NextResponse.json(
        {
          message: "Invalid contest ID",
        },
        { status: 400 }
      );
    }

    // Get contest
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      select: {
        tournamentId: true,
        rules: true,
      },
    });

    if (!contest) {
      return NextResponse.json(
        {
          message: "Contest not found",
        },
        { status: 404 }
      );
    }

    // Parse rules
    let rules = {};
    try {
      rules = JSON.parse(contest.rules || "{}");
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }

    // Get players for this tournament
    const players = await prisma.player.findMany({
      where: {
        tournamentEntries: {
          some: {
            tournamentId: contest.tournamentId,
          },
        },
      },
      orderBy: {
        rank: "asc",
      },
    });

    // Calculate fantasy price for each player
    const playersWithPrices = players.map((player) => {
      // Find player category from rules
      let categoryPrice = 5000; // Default price
      if (rules.playerCategories && Array.isArray(rules.playerCategories)) {
        const category = player.skillLevel?.toLowerCase() || "";
        const categoryData = rules.playerCategories.find(
          (c: any) => c.name.toLowerCase() === category
        );

        if (categoryData) {
          categoryPrice = categoryData.price;
        }
      }

      // If no category found, calculate based on rank
      if (!categoryPrice && player.rank) {
        categoryPrice = Math.max(1000 / player.rank, 500);
      }

      return {
        ...player,
        fantasyPrice: categoryPrice,
      };
    });

    return NextResponse.json(
      {
        players: playersWithPrices,
        walletSize: rules.walletSize || 100000,
      },
      { status: 200 }
    );
  } catch (error) {
    return errorHandler(error, request);
  }
}

/**
 * GET /api/fantasy-pickleball/contests/:id/leaderboard
 * Get contest leaderboard
 */
export async function GET_LEADERBOARD(request: NextRequest) {
  try {
    // Parse URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const contestId = parseInt(segments[segments.length - 2], 10);
    const { searchParams } = url;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (isNaN(contestId)) {
      return NextResponse.json(
        {
          message: "Invalid contest ID",
        },
        { status: 400 }
      );
    }

    // Get contest
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      select: {
        name: true,
        entryFee: true,
        prizePool: true,
        currentEntries: true,
      },
    });

    if (!contest) {
      return NextResponse.json(
        {
          message: "Contest not found",
        },
        { status: 404 }
      );
    }

    // Get teams for this contest
    const [teams, total] = await Promise.all([
      prisma.fantasyTeam.findMany({
        where: { contestId },
        orderBy: { totalPoints: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      }),
      prisma.fantasyTeam.count({ where: { contestId } }),
    ]);

    // Calculate prize breakdown
    const prizeBreakdown = calculatePrizeBreakdown(
      contest.prizePool,
      contest.currentEntries
    );

    return NextResponse.json(
      {
        leaderboard: teams,
        contest: {
          name: contest.name,
          entryFee: contest.entryFee,
          prizePool: contest.prizePool,
          participants: contest.currentEntries,
        },
        prizeBreakdown,
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
 * Helper function to calculate prize breakdown
 */
function calculatePrizeBreakdown(prizePool: number, participants: number) {
  const breakdown = [];

  if (participants < 5) {
    // Only 1 winner who gets 70% (we get 15% and admin gets 15%)
    breakdown.push({
      position: 1,
      percentage: 70,
      amount: prizePool * 0.7,
    });
  } else if (participants < 30) {
    // Top 3 get prizes (40%, 24%, 16%)
    breakdown.push({
      position: 1,
      percentage: 40,
      amount: prizePool * 0.4,
    });
    breakdown.push({
      position: 2,
      percentage: 24,
      amount: prizePool * 0.24,
    });
    breakdown.push({
      position: 3,
      percentage: 16,
      amount: prizePool * 0.16,
    });
  } else {
    // Top 10 get prizes (40%, 24%, 16%, remaining 20% split between positions 4-10)
    breakdown.push({
      position: 1,
      percentage: 40,
      amount: prizePool * 0.4,
    });
    breakdown.push({
      position: 2,
      percentage: 24,
      amount: prizePool * 0.24,
    });
    breakdown.push({
      position: 3,
      percentage: 16,
      amount: prizePool * 0.16,
    });

    // Positions 4-10 split remaining 20%
    const remainingPercentage = 20 / 7; // ~2.86% each
    const remainingAmount = (prizePool * 0.2) / 7;

    for (let i = 4; i <= 10; i++) {
      breakdown.push({
        position: i,
        percentage: parseFloat(remainingPercentage.toFixed(2)),
        amount: remainingAmount,
      });
    }
  }

  return breakdown;
}
