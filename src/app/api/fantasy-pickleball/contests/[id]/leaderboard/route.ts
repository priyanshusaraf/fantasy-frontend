// src/app/api/fantasy-pickleball/contests/[id]/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contestId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Validate pagination
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        {
          message: "Invalid pagination parameters",
        },
        { status: 400 }
      );
    }

    // Check if contest exists
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      select: {
        name: true,
        entryFee: true,
        prizePool: true,
        currentEntries: true,
        status: true,
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

    // Get teams with pagination, sorted by points
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

    // Add rank to teams
    const teamsWithRank = teams.map((team, index) => ({
      ...team,
      rank: (page - 1) * limit + index + 1,
    }));

    // Calculate prize breakdown
    const prizeBreakdown = calculatePrizeBreakdown(
      contest.prizePool,
      contest.currentEntries
    );

    return NextResponse.json({
      leaderboard: teamsWithRank,
      contest: {
        name: contest.name,
        entryFee: contest.entryFee,
        prizePool: contest.prizePool,
        participants: contest.currentEntries,
        status: contest.status,
      },
      prizeBreakdown,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * Helper function to calculate prize breakdown
 */
function calculatePrizeBreakdown(prizePool: number, participants: number) {
  const breakdown = [];

  if (participants < 5) {
    // Only 1 winner who gets 70% (15% commission + 15% to platform)
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
