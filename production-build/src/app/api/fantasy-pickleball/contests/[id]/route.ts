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
    const { params } = context;
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
            teams: true,
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
    
    // Parse rules as needed
    let rules = {};
    try {
      if (contest.rules) {
        rules = JSON.parse(contest.rules);
      }
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }
    
    console.log(`Successfully fetched contest: ${contest.name}`);
    
    // Return formatted contest data
    return NextResponse.json(
      {
        contest: {
          id: contest.id,
          name: contest.name,
          entryFee: contest.entryFee,
          prizePool: contest.prizePool,
          maxEntries: contest.maxEntries,
          currentEntries: contest.currentEntries,
          startDate: contest.startDate,
          endDate: contest.endDate,
          status: contest.status,
          description: contest.description,
          rules,
          tournament: contest.tournament,
          participantCount: contest._count.teams,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching contest:", error);
    return errorHandler(error as Error, request);
  }
} 