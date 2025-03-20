import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Simple logger implementation
const logger = {
  info: (message: any) => console.log("[INFO]", message),
  error: (message: any) => console.error("[ERROR]", message)
};

// Define type for contest rules
interface ContestRules {
  playerCategories?: Array<{name: string, price: number}>;
  walletSize?: number;
  fantasyTeamSize?: number;
  allowTeamChanges?: boolean;
  changeFrequency?: string;
  maxPlayersToChange?: number;
  changeWindowStart?: string;
  changeWindowEnd?: string;
  [key: string]: any;
}

// Define types for contest with count
interface ContestWithCount {
  id: number;
  name: string;
  description?: string;
  tournamentId: number;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  startDate: Date;
  endDate: Date;
  status: string;
  rules?: string;
  createdAt: Date;
  updatedAt: Date;
  tournament?: {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    location: string;
    status: string;
    imageUrl?: string;
  };
  _count: {
    fantasyTeams: number;
  };
}

// Define types for player data
interface PlayerData {
  id: number;
  name: string;
  skillLevel?: any; // Accept any type for skillLevel due to DB enum
  imageUrl?: string;
  price?: number;
  rank?: number | null;
  category?: string;
  teamMemberships?: any[];
  [key: string]: any;
}

// Define types for team leaderboard data
interface TeamLeaderboardData {
  id: number;
  name: string;
  userId: number;
  username?: string;
  contestId: number;
  totalPoints: number;
  rank: number;
  user?: {
    username: string | null;
  };
  [key: string]: any;
}

/**
 * GET /api/fantasy-pickleball/contests
 * Get all contests or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching fantasy contests");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const tournamentId = searchParams.get("tournamentId");
    const forceRefresh = searchParams.get("force") === "true";

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
      // Map UI status labels to actual database enum values
      const statusMap: Record<string, string> = {
        'UPCOMING': 'OPEN',
        'IN_PROGRESS': 'ONGOING',
        'COMPLETED': 'COMPLETED',
        'CANCELLED': 'CANCELLED',
        'DRAFT': 'DRAFT',
        'CLOSED': 'CLOSED',
        'OPEN': 'OPEN',
        'ONGOING': 'ONGOING'
      };
      
      // Handle multiple status values
      const statusValues = status.split(",");
      const validEnumValues = statusValues
        .map(s => statusMap[s])
        .filter(Boolean);
      
      if (validEnumValues.length > 0) {
        where.status = {
          in: validEnumValues,
        };
      }
    }

    if (tournamentId) {
      where.tournamentId = parseInt(tournamentId);
    }

    console.log("Query parameters:", { page, limit, status, tournamentId, forceRefresh });
    console.log("Where conditions:", where);

    // Get contests with pagination
    const [contests, total] = await Promise.all([
      prisma.fantasyContest.findMany({
        where,
        include: {
          tournament: {
            select: {
              id: true,
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
              fantasyTeams: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fantasyContest.count({ where }),
    ]);

    console.log(`Found ${contests.length} contests out of ${total} total`);
    
    // For debugging, log the first contest if available
    if (contests.length > 0) {
      console.log("First contest:", {
        id: contests[0].id,
        name: contests[0].name,
        tournamentId: contests[0].tournamentId,
        tournamentName: contests[0].tournament?.name
      });
    }

    // Parse rules for each contest
    const contestsWithParsedRules = contests.map((contest: any) => {
      let rules: ContestRules = {};
      try {
        // Check if rules exist and parse them
        if (typeof contest.rules === 'string') {
          rules = JSON.parse(contest.rules) as ContestRules;
        }
      } catch (e) {
        console.error("Error parsing contest rules:", e);
      }

      return {
        ...contest,
        rules,
        participantCount: contest._count.fantasyTeams,
      };
    });

    const totalPages = Math.ceil(total / limit);
    console.log(`Returning ${contestsWithParsedRules.length} contests, page ${page} of ${totalPages}`);

    // Set cache control headers based on the force parameter
    const response = NextResponse.json(
      {
        contests: contestsWithParsedRules,
        total,
        page,
        limit,
        totalPages,
      },
      { status: 200 }
    );
    
    // Set cache control headers
    if (forceRefresh) {
      // No caching when force refresh is requested
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
      // Add a timestamp to response to confirm fresh data
      response.headers.set('X-Data-Timestamp', new Date().toISOString());
    } else {
      // Limited caching for normal requests (30 seconds)
      response.headers.set('Cache-Control', 'public, max-age=30');
    }
    
    return response;
  } catch (error: any) {
    console.error("Error fetching fantasy contests:", error);
    return errorHandler(error, request);
  }
}

/**
 * POST /api/fantasy-pickleball/contests
 * Create a new fantasy contest
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only allow admins to create contests
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await req.json();
    const { tournamentId, name, description, entryFee, maxEntries, rules, isPublished, contestLogo } = body;

    if (!tournamentId || !name || entryFee === undefined || !maxEntries) {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, name, entryFee, maxEntries' },
        { status: 400 }
      );
    }

    // Validate rules
    if (!rules) {
      return NextResponse.json({ error: 'Contest rules are required' }, { status: 400 });
    }

    // Start prize pool at 0 - it will be dynamically updated based on registrations using the 77.64% calculation
    const prizePool = 0;

    // Create the contest with validated data
    const contest = await prisma.fantasyContest.create({
      data: {
        tournamentId,
        name,
        description: description || '',
        entryFee,
        maxEntries,
        prizePool, // Starting at 0, will be updated dynamically
        isPublished: isPublished || false,
        contestLogo: contestLogo || null,
        rules: {
          create: {
            teamSize: rules.teamSize,
            maxFromSameTeam: rules.maxFromSameTeam,
            allowedPositions: {
              create: rules.allowedPositions.map((pos: any) => ({
                position: pos.position,
                min: pos.min,
                max: pos.max
              }))
            },
            prizeDistribution: {
              create: rules.prizeDistribution.map((prize: any) => ({
                rank: prize.rank,
                percentage: prize.percentage
              }))
            }
          }
        }
      },
      include: {
        rules: {
          include: {
            allowedPositions: true,
            prizeDistribution: true
          }
        }
      }
    });

    // Log creation for auditing
    logger.info({
      message: 'Fantasy contest created',
      contestId: contest.id,
      createdBy: session.user.id
    });

    return NextResponse.json(contest);
  } catch (error) {
    logger.error({
      message: 'Error creating fantasy contest',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Failed to create fantasy contest' },
      { status: 500 }
    );
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
        fantasyTeams: {
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
            fantasyTeams: true,
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

    // Parse rules from the contest object
    let rules: ContestRules = {};
    try {
      // Handle rules based on what's actually in the database
      const contestAny = contest as any;
      if (contestAny.rules && typeof contestAny.rules === 'string') {
        rules = JSON.parse(contestAny.rules) as ContestRules;
      }
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
      include: {
        teamMemberships: {
          where: {
            tournamentId: contest.tournamentId
          }
        }
      },
      orderBy: {
        rank: "asc",
      },
    });

    // Calculate fantasy price for each player
    const playersWithPrices = players.map((player: any) => {
      // Find player category from rules
      let categoryPrice = 5000; // Default price
      if (rules.playerCategories && Array.isArray(rules.playerCategories)) {
        // Handle different skill level types
        const skillLevel = player.skillLevel ? 
          (typeof player.skillLevel === 'string' ? 
            player.skillLevel : 
            String(player.skillLevel)
          ).toLowerCase() : '';
        const categoryData = rules.playerCategories.find(
          (c: any) => c.name.toLowerCase() === skillLevel
        );

        if (categoryData) {
          categoryPrice = categoryData.price;
        }
      }

      // If no category found, calculate based on rank
      if (!categoryPrice && player.rank) {
        categoryPrice = Math.max(1000 / player.rank, 500);
      }

      // Get team information
      const team = player.teamMemberships?.length > 0 ? player.teamMemberships[0] : null;

      return {
        ...player,
        fantasyPrice: categoryPrice,
        teamId: team?.id || null,
        teamName: team?.name || null,
        // Remove teamMemberships from the response
        teamMemberships: undefined
      };
    });

    return NextResponse.json(
      {
        contest: {
          ...contest,
          rules,
          participantCount: contest._count.fantasyTeams,
        },
        players: playersWithPrices,
      },
      { status: 200 }
    );
  } catch (error: any) {
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

    // Parse rules from default values
    const rules: ContestRules = {
      walletSize: 100000,
      fantasyTeamSize: 7,
      playerCategories: [
        { name: "PROFESSIONAL", price: 10000 },
        { name: "ADVANCED", price: 7500 },
        { name: "INTERMEDIATE", price: 5000 },
        { name: "BEGINNER", price: 2500 }
      ]
    };
    
    // Get players for this tournament
    const players = await prisma.player.findMany({
      where: {
        tournamentEntries: {
          some: {
            tournamentId: contest.tournamentId,
          },
        },
      },
      include: {
        teamMemberships: {
          where: {
            tournamentId: contest.tournamentId
          }
        }
      },
      orderBy: {
        rank: "asc",
      },
    });

    // Calculate fantasy price for each player
    const playersWithPrices = players.map((player: any) => {
      // Find player category from rules
      let categoryPrice = 5000; // Default price
      if (rules.playerCategories && Array.isArray(rules.playerCategories)) {
        // Handle different skill level types
        const skillLevel = player.skillLevel ? 
          (typeof player.skillLevel === 'string' ? 
            player.skillLevel : 
            String(player.skillLevel)
          ).toLowerCase() : '';
        const categoryData = rules.playerCategories.find(
          (c: any) => c.name.toLowerCase() === skillLevel
        );

        if (categoryData) {
          categoryPrice = categoryData.price;
        }
      }

      // If no category found, calculate based on rank
      if (!categoryPrice && player.rank) {
        categoryPrice = Math.max(1000 / player.rank, 500);
      }

      // Get team information
      const team = player.teamMemberships?.length > 0 ? player.teamMemberships[0] : null;

      return {
        ...player,
        fantasyPrice: categoryPrice,
        teamId: team?.id || null,
        teamName: team?.name || null,
        // Remove teamMemberships from the response
        teamMemberships: undefined
      };
    });

    return NextResponse.json(
      {
        players: playersWithPrices,
        walletSize: rules.walletSize || 100000,
        maxTeamSize: rules.fantasyTeamSize || 7,
      },
      { status: 200 }
    );
  } catch (error: any) {
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

    // Calculate prize breakdown based on total number of teams
    const prizeBreakdown = calculatePrizeBreakdown(
      Number(contest.prizePool),
      total
    );

    // Process team data
    const teamLeaderboardData = teams.map((team: any) => {
      return {
        ...team,
        username: team.user?.username || "Anonymous",
      };
    });

    return NextResponse.json(
      {
        leaderboard: teamLeaderboardData,
        contest: {
          name: contest.name,
          entryFee: contest.entryFee,
          prizePool: contest.prizePool,
          participants: total,
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
  } catch (error: any) {
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
