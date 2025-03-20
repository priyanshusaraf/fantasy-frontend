import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/db";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// The exact percentage of entry fees that goes to the prize pool, as specified by the user
const PRIZE_POOL_PERCENTAGE = 77.64;

/**
 * GET /api/tournaments/[id]/prize-pool
 * Calculate the dynamic prize pool for a tournament based on entry fees and registered participants
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const tournamentId = parseInt(params.id);

    // Get all contests for the tournament
    const contests = await prisma.fantasyContest.findMany({
      where: {
        tournamentId: tournamentId,
      },
      include: {
        fantasyTeams: true,
      },
    });

    // Calculate the total entry fees collected
    let totalEntryFees = 0;
    let totalRegistrations = 0;

    contests.forEach((contest) => {
      const contestFees = contest.entryFee * contest.fantasyTeams.length;
      totalEntryFees += contestFees;
      totalRegistrations += contest.fantasyTeams.length;
    });

    // Calculate the dynamic prize pool (77.64% of total entry fees)
    const dynamicPrizePool = (totalEntryFees * PRIZE_POOL_PERCENTAGE) / 100;

    return NextResponse.json({
      tournamentId,
      totalEntryFees,
      totalRegistrations,
      prizePoolPercentage: PRIZE_POOL_PERCENTAGE,
      dynamicPrizePool,
    });
  } catch (error) {
    console.error('Error calculating prize pool:', error);
    return NextResponse.json(
      { error: 'Failed to calculate prize pool' },
      { status: 500 }
    );
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
    
    // Only admin or tournament admin can update prize pools
    if (!["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          message: "Not authorized to update prize pools",
        },
        { status: 403 }
      );
    }
    
    // Get request data
    const data = await request.json();
    const { contestId } = data;
    
    if (!contestId) {
      return NextResponse.json(
        {
          message: "Contest ID is required",
        },
        { status: 400 }
      );
    }
    
    // Get contest data
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
    });
    
    if (!contest) {
      return NextResponse.json(
        {
          message: "Contest not found",
        },
        { status: 404 }
      );
    }
    
    // Count teams for this contest
    const teamCount = await prisma.fantasyTeam.count({
      where: {
        contestId,
      },
    });
    
    // Calculate dynamic prize pool
    const totalEntryFees = teamCount * contest.entryFee;
    const dynamicPrizePool = (totalEntryFees * PRIZE_POOL_PERCENTAGE) / 100;
    
    // Update contest prize pool
    const updatedContest = await prisma.fantasyContest.update({
      where: { id: contestId },
      data: {
        prizePool: dynamicPrizePool,
      },
    });
    
    // Get prize distribution rules based on number of participants
    const prizeDistribution = getPrizeDistribution(teamCount);
    
    // Update or create prize distribution rules
    await updatePrizeRules(contestId, prizeDistribution);
    
    return NextResponse.json({
      ...updatedContest,
      teamCount,
      prizeDistribution,
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

// Helper function to determine prize distribution based on participant count
function getPrizeDistribution(participantCount: number) {
  let distribution: { rank: number; percentage: number }[] = [];
  
  if (participantCount < 5) {
    // Winner takes all for fewer than 5 participants
    distribution = [{ rank: 1, percentage: 100 }];
  } else if (participantCount >= 5 && participantCount <= 8) {
    // Top 2 for 5-8 participants
    distribution = [
      { rank: 1, percentage: 70 },
      { rank: 2, percentage: 30 },
    ];
  } else if (participantCount >= 9 && participantCount <= 15) {
    // Top 3 for 9-15 participants
    distribution = [
      { rank: 1, percentage: 60 },
      { rank: 2, percentage: 25 },
      { rank: 3, percentage: 15 },
    ];
  } else if (participantCount >= 16 && participantCount <= 25) {
    // Top 5 for 16-25 participants
    distribution = [
      { rank: 1, percentage: 50 },
      { rank: 2, percentage: 25 },
      { rank: 3, percentage: 15 },
      { rank: 4, percentage: 7 },
      { rank: 5, percentage: 3 },
    ];
  } else {
    // Top 10 for 26+ participants
    distribution = [
      { rank: 1, percentage: 40 },
      { rank: 2, percentage: 20 },
      { rank: 3, percentage: 15 },
      { rank: 4, percentage: 7 },
      { rank: 5, percentage: 5 },
      { rank: 6, percentage: 4 },
      { rank: 7, percentage: 3 },
      { rank: 8, percentage: 3 },
      { rank: 9, percentage: 2 },
      { rank: 10, percentage: 1 },
    ];
  }
  
  return distribution;
}

// Helper function to update prize distribution rules
async function updatePrizeRules(contestId: number, distribution: { rank: number; percentage: number }[]) {
  try {
    // Find existing contestPrizeRule
    let contestPrizeRule = await prisma.contestPrizeRule.findUnique({
      where: { contestId },
    });
    
    if (contestPrizeRule) {
      // Delete existing prize distribution rules
      await prisma.prizeDistributionRule.deleteMany({
        where: { contestPrizeRuleId: contestPrizeRule.id },
      });
      
      // Create new prize distribution rules
      for (const rule of distribution) {
        await prisma.prizeDistributionRule.create({
          data: {
            contestPrizeRuleId: contestPrizeRule.id,
            rank: rule.rank,
            percentage: rule.percentage,
            minPlayers: 1,
          },
        });
      }
    } else {
      // Get tournament ID for the contest
      const contest = await prisma.fantasyContest.findUnique({
        where: { id: contestId },
        select: { tournamentId: true },
      });
      
      if (!contest) {
        throw new Error("Contest not found");
      }
      
      // Create new contest prize rule
      contestPrizeRule = await prisma.contestPrizeRule.create({
        data: {
          contestId,
          tournamentId: contest.tournamentId,
        },
      });
      
      // Create prize distribution rules
      for (const rule of distribution) {
        await prisma.prizeDistributionRule.create({
          data: {
            contestPrizeRuleId: contestPrizeRule.id,
            rank: rule.rank,
            percentage: rule.percentage,
            minPlayers: 1,
          },
        });
      }
    }
    
    return contestPrizeRule;
  } catch (error) {
    console.error("Error updating prize rules:", error);
    throw error;
  }
} 