import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/fantasy-pickleball/contests/[id]
 * Get a specific contest by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const contestId = parseInt(params.id);
    
    console.log(`Fetching contest with ID: ${contestId}`);
    
    if (isNaN(contestId)) {
      return NextResponse.json(
        { message: "Invalid contest ID" },
        { status: 400 }
      );
    }
    
    // Fetch the contest with tournament info
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            location: true,
            startDate: true,
            endDate: true,
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
    });
    
    if (!contest) {
      console.log(`Contest with ID ${contestId} not found`);
      return NextResponse.json(
        { message: "Contest not found" },
        { status: 404 }
      );
    }
    
    // Return formatted contest data
    const teamCount = contest._count.fantasyTeams;
    
    // Parse rules as needed
    let rules = {};
    try {
      // Safely access rules property which might not exist in the type
      const rulesString = (contest as any).rules;
      if (rulesString) {
        rules = JSON.parse(rulesString);
      }
    } catch (error) {
      console.error("Error parsing contest rules:", error);
    }
    
    console.log(`Successfully fetched contest: ${contest.name}`);
    
    return NextResponse.json({
      contest: {
        id: contest.id,
        name: contest.name,
        entryFee: contest.entryFee,
        prizePool: contest.prizePool,
        maxEntries: contest.maxEntries,
        currentEntries: teamCount,
        startDate: contest.startDate,
        endDate: contest.endDate,
        status: contest.status,
        description: contest.description,
        rules,
        tournament: contest.tournament,
        participantCount: teamCount,
        isDynamicPrizePool: true, // All contests use dynamic prize pool
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching contest:", error);
    return errorHandler(error as Error, request);
  }
} 