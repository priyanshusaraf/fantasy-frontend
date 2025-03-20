import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import { FantasyTeamService } from "@/lib/services/fantasy-team-service";

// Contest rules interface
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

interface CreateTeamRequestBody {
  contestId: number;
  name: string;
  players: {
    playerId: number;
    isCaptain: boolean;
    isViceCaptain: boolean;
  }[];
}

/**
 * POST /api/fantasy-pickleball/create-team
 * Create a new fantasy team
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Get current user from auth middleware
    const { user } = request;
    if (!user) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateTeamRequestBody = await request.json();

    // Basic validation
    if (
      !body.contestId ||
      !body.name ||
      !body.players ||
      !Array.isArray(body.players)
    ) {
      return NextResponse.json(
        {
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Get contest details
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: body.contestId },
      include: {
        tournament: true,
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

    // Check if contest is open for registration
    if (contest.status !== "OPEN" && contest.status !== "DRAFT") {
      return NextResponse.json(
        {
          message: "Contest is not open for registration",
        },
        { status: 400 }
      );
    }

    // Check if tournament has started
    if (new Date() > contest.tournament.startDate) {
      return NextResponse.json(
        {
          message: "Tournament has already started",
        },
        { status: 400 }
      );
    }

    // Check if user has already created a team for this contest
    const existingTeam = await prisma.fantasyTeam.findFirst({
      where: {
        userId: user.id,
        contestId: body.contestId,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        {
          message: "You already have a team in this contest",
        },
        { status: 400 }
      );
    }

    // Check player selections
    // Determine team size from contest configuration or use default
    const teamSize = 7; // Default team size if not specified

    if (body.players.length !== teamSize) {
      return NextResponse.json(
        {
          message: `You must select exactly ${teamSize} players`,
        },
        { status: 400 }
      );
    }

    // Validate captain and vice-captain
    const captains = body.players.filter((p) => p.isCaptain);
    const viceCaptains = body.players.filter((p) => p.isViceCaptain);

    if (captains.length !== 1) {
      return NextResponse.json(
        {
          message: "You must select exactly one captain",
        },
        { status: 400 }
      );
    }

    if (viceCaptains.length !== 1) {
      return NextResponse.json(
        {
          message: "You must select exactly one vice-captain",
        },
        { status: 400 }
      );
    }

    if (captains[0].playerId === viceCaptains[0].playerId) {
      return NextResponse.json(
        {
          message: "Captain and vice-captain must be different players",
        },
        { status: 400 }
      );
    }

    // Create the fantasy team
    const newTeam = await prisma.fantasyTeam.create({
      data: {
        name: body.name,
        userId: user.id,
        contestId: body.contestId,
        totalPoints: 0,
        players: {
          create: body.players.map(player => ({
            playerId: player.playerId,
            isCaptain: player.isCaptain,
            isViceCaptain: player.isViceCaptain
          }))
        }
      },
      include: {
        players: {
          include: {
            player: true
          }
        },
        contest: true
      }
    });

    return NextResponse.json(
      { 
        message: "Team created successfully", 
        team: newTeam 
      }, 
      { status: 201 }
    );
  } catch (error: any) {
    return errorHandler(error, request);
  }
}
