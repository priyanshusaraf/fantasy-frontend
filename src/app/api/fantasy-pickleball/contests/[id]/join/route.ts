// src/app/api/fantasy-pickleball/contests/[id]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

// Contest rules interface
interface ContestRules {
  playerCategories?: Array<{name: string, price: number}>;
  walletSize?: number;
  fantasyTeamSize?: number;
  teamSize?: number; // Some code seems to use this instead of fantasyTeamSize
  allowTeamChanges?: boolean;
  changeFrequency?: string;
  maxPlayersToChange?: number;
  changeWindowStart?: string;
  changeWindowEnd?: string;
  [key: string]: any;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const contestId = parseInt(params.id);
    const { user } = request as any;

    // Get request data
    const { name, players, captain, viceCaptain } = await request.json();

    // Validate required fields
    if (!name || !players || !captain || !viceCaptain) {
      return NextResponse.json(
        {
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Check if contest exists and is open
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
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

    if (contest.status !== "UPCOMING") {
      return NextResponse.json(
        {
          message: "Contest is no longer open for entries",
        },
        { status: 400 }
      );
    }

    // Check if user already has a team in this contest
    const existingTeam = await prisma.fantasyTeam.findFirst({
      where: {
        userId: user.id,
        contestId,
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

    // Parse contest rules
    let rules: ContestRules = {};
    try {
      if (typeof contest.rules === "string") {
        rules = JSON.parse(contest.rules || "{}") as ContestRules;
      } else if (contest.rules) {
        rules = contest.rules as ContestRules;
      }
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }

    // Check team size
    const teamSize = rules.teamSize || rules.fantasyTeamSize || 7;
    if (players.length !== teamSize) {
      return NextResponse.json(
        {
          message: `Team must have exactly ${teamSize} players`,
        },
        { status: 400 }
      );
    }

    // Verify captain and vice-captain are in the team
    if (!players.includes(captain)) {
      return NextResponse.json(
        {
          message: "Captain must be in your team",
        },
        { status: 400 }
      );
    }

    if (!players.includes(viceCaptain)) {
      return NextResponse.json(
        {
          message: "Vice captain must be in your team",
        },
        { status: 400 }
      );
    }

    if (captain === viceCaptain) {
      return NextResponse.json(
        {
          message: "Captain and vice captain must be different players",
        },
        { status: 400 }
      );
    }

    // Check budget constraints
    const selectedPlayers = await prisma.player.findMany({
      where: {
        id: { in: players },
      },
    });

    // Get player prices from rules
    const walletSize = rules.walletSize || 100000;
    const playerPrices: Record<number, number> = {};

    // Assign prices based on skill level categories
    selectedPlayers.forEach((player) => {
      // Find player category from rules
      let categoryPrice = 5000; // Default price
      if (
        rules.playerCategories &&
        Array.isArray(rules.playerCategories)
      ) {
        const category = rules.playerCategories.find(
          (c: any) => c.playerSkillLevel === player.skillLevel
        );

        if (category) {
          categoryPrice = category.price;
        }
      }

      playerPrices[player.id] = categoryPrice;
    });

    // Calculate total cost
    const totalCost = Object.values(playerPrices).reduce(
      (sum, price) => sum + price,
      0
    );

    if (totalCost > walletSize) {
      return NextResponse.json(
        {
          message: "Team exceeds budget limit",
        },
        { status: 400 }
      );
    }

    // Create the team
    const team = await prisma.fantasyTeam.create({
      data: {
        name,
        userId: user.id,
        contestId,
        totalPoints: 0,
        players: {
          create: players.map((playerId: number) => ({
            playerId,
            isCaptain: playerId === captain,
            isViceCaptain: playerId === viceCaptain,
          })),
        },
      },
      include: {
        players: true,
      },
    });

    // Update contest entries count
    await prisma.fantasyContest.update({
      where: { id: contestId },
      data: {
        currentEntries: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
