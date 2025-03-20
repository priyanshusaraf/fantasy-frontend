import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get("contestId");
    
    if (!contestId) {
      return NextResponse.json({ error: "Contest ID is required" }, { status: 400 });
    }
    
    // Get all fantasy teams for the contest with user info and total points
    const fantasyTeams = await prisma.fantasyTeam.findMany({
      where: {
        contestId: parseInt(contestId),
      },
      select: {
        id: true,
        name: true,
        totalPoints: true,
        user: {
          select: {
            name: true,
            username: true,
            // Don't include email as it's sensitive personal information
          },
        },
      },
      orderBy: {
        totalPoints: 'desc',
      },
    });
    
    // Calculate ranks
    const teamsWithRanks = fantasyTeams.map((team: any, index: number) => ({
      id: team.id,
      name: team.name,
      totalPoints: team.totalPoints,
      rank: index + 1,
      user: {
        name: team.user.name,
        username: team.user.username,
      },
    }));
    
    // Get contest details for prize info
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: parseInt(contestId) },
      select: {
        prizePool: true,
        contestPrizeRule: {
          include: {
            prizeDistributionRules: true,
          },
        },
      },
    });
    
    // Calculate expected prize for each team based on rank and prize distribution rules
    const teamsWithPrizes = teamsWithRanks.map((team: any) => {
      let expectedPrize = 0;
      
      if (contest?.contestPrizeRule?.prizeDistributionRules) {
        const rule = contest.contestPrizeRule.prizeDistributionRules.find(
          (r: any) => r.rank === team.rank
        );
        
        if (rule) {
          expectedPrize = (rule.percentage / 100) * (contest.prizePool || 0);
        }
      }
      
      return {
        ...team,
        expectedPrize,
      };
    });
    
    return NextResponse.json(teamsWithPrizes);
  } catch (error) {
    console.error("Error fetching fantasy leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch fantasy leaderboard" }, { status: 500 });
  }
} 