// src/app/api/tournaments/[id]/fantasy-contests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id);

    // Get all fantasy contests for this tournament
    const contests = await prisma.fantasyContest.findMany({
      where: {
        tournamentId,
      },
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
        _count: {
          select: { teams: true },
        },
      },
      orderBy: {
        entryFee: "asc",
      },
    });

    // Format contests to include team count
    const formattedContests = contests.map((contest) => ({
      ...contest,
      currentEntries: contest._count.teams,
      _count: undefined,
    }));

    return NextResponse.json({ contests: formattedContests });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check auth
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const tournamentId = parseInt(params.id);
    const { user } = request as any;

    // Only admin or tournament admin can create contests
    if (!["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          message: "Not authorized to create contests",
        },
        { status: 403 }
      );
    }

    // Get contest data
    const data = await request.json();
    const { name, entryFee, prizePool, maxEntries, startDate, endDate, rules } =
      data;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          message: "Contest name is required",
        },
        { status: 400 }
      );
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, startDate: true, endDate: true },
    });

    if (!tournament) {
      return NextResponse.json(
        {
          message: "Tournament not found",
        },
        { status: 404 }
      );
    }

    // Create contest
    const contest = await prisma.fantasyContest.create({
      data: {
        name,
        entryFee: entryFee || 0,
        prizePool: prizePool || 0,
        maxEntries: maxEntries || 100,
        startDate: startDate
          ? new Date(startDate)
          : new Date(tournament.startDate),
        endDate: endDate ? new Date(endDate) : new Date(tournament.endDate),
        status: "OPEN",
        tournament: {
          connect: { id: tournamentId },
        },
      },
    });
    
    // Now create the ContestPrizeRule
    if (contest) {
      try {
        const prizeRule = await prisma.contestPrizeRule.create({
          data: {
            tournamentId: tournamentId,
            contestId: contest.id,
          }
        });
        
        // Parse and store prize distribution rules if provided
        if (rules) {
          let rulesObj;
          try {
            rulesObj = typeof rules === 'string' ? JSON.parse(rules) : rules;
          } catch (e) {
            console.error("Error parsing rules JSON:", e);
            rulesObj = {};
          }
          
          if (rulesObj.prizeBreakdown && Array.isArray(rulesObj.prizeBreakdown)) {
            for (const prize of rulesObj.prizeBreakdown) {
              await prisma.prizeDistributionRule.create({
                data: {
                  tournamentId: tournamentId,
                  contestPrizeRuleId: prizeRule.id,
                  position: prize.position,
                  percentage: prize.percentage,
                  minPosition: prize.position,
                  maxPosition: prize.position
                }
              });
            }
          }
        }
      } catch (error) {
        console.error("Error creating prize rules:", error);
      }
    }

    return NextResponse.json(contest, { status: 201 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
