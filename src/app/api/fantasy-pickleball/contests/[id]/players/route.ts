// src/app/api/fantasy-pickleball/contests/[id]/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contestId = parseInt(params.id);

    // Get contest and its rules
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      select: {
        rules: true,
        tournament: {
          select: {
            id: true,
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
      rules =
        typeof contest.rules === "string"
          ? JSON.parse(contest.rules)
          : contest.rules || {};
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }

    // Get all players in tournament
    const players = await prisma.player.findMany({
      where: {
        tournamentEntries: {
          some: {
            tournamentId: contest.tournament.id,
          },
        },
      },
    });

    // Calculate fantasy price for each player based on rules
    const playersWithPrices = players.map((player) => {
      // Find player category from rules
      let categoryPrice = 5000; // Default price

      if (
        (rules as any).categories &&
        Array.isArray((rules as any).categories)
      ) {
        const category = (rules as any).categories.find(
          (c: any) => c.playerSkillLevel === player.skillLevel
        );

        if (category) {
          categoryPrice = category.price;
        }
      }

      return {
        ...player,
        price: categoryPrice,
      };
    });

    return NextResponse.json({
      players: playersWithPrices,
      walletSize: (rules as any).walletSize || 100000,
      maxTeamSize: (rules as any).teamSize || 7,
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
