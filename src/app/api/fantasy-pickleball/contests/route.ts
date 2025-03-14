// src/app/api/fantasy-pickleball/contests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FantasyService } from "@/lib/services/fantasy-service";
import { adminMiddleware, authMiddleware } from "@/middleware/auth";
import { ContestStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as ContestStatus | undefined;
    const tournamentId = searchParams.get("tournamentId")
      ? parseInt(searchParams.get("tournamentId")!)
      : undefined;
    const search = searchParams.get("search") || undefined;

    // Get contests with filtering
    const contestsData = await FantasyService.listContests({
      page,
      limit,
      status,
      tournamentId,
      search,
    });

    return NextResponse.json(contestsData, { status: 200 });
  } catch (error) {
    console.error("Error fetching contests:", error);
    return NextResponse.json(
      { message: "Failed to fetch contests", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admins can create contests
    const authResponse = await adminMiddleware(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    // Get contest data from request
    const data = await request.json();

    // Validate required fields
    if (
      !data.name ||
      !data.tournamentId ||
      !data.maxEntries ||
      !data.entryFee ||
      !data.startDate ||
      !data.endDate
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { message: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create contest
    const contest = await FantasyService.createContest({
      name: data.name,
      tournament: { connect: { id: data.tournamentId } },
      entryFee: data.entryFee,
      prizePool: data.prizePool || data.entryFee * data.maxEntries * 0.8, // 80% of total entry fees
      maxEntries: data.maxEntries,
      currentEntries: 0,
      startDate,
      endDate,
      status: data.status || "UPCOMING",
      description: data.description,
      rules: data.rules,
    });

    return NextResponse.json(contest, { status: 201 });
  } catch (error) {
    console.error("Error creating contest:", error);
    return NextResponse.json(
      { message: "Failed to create contest", error: (error as Error).message },
      { status: 500 }
    );
  }
}
