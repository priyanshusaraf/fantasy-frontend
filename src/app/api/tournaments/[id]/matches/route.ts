// src/app/api/tournaments/[id]/matches/route.ts
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const round = searchParams.get("round");

    // Build filter
    const where: any = {
      tournamentId,
      ...(status && { status }),
      ...(round && { round }),
    };

    // Get matches for the tournament
    const matches = await prisma.match.findMany({
      where,
      include: {
        player1: true,
        player2: true,
        referee: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        team1: true,
        team2: true,
        winner: true,
      },
      orderBy: [{ startTime: "asc" }, { round: "asc" }],
    });

    // Group matches by round
    const matchesByRound = matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      matches,
      matchesByRound,
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { user } = request as any;
    const tournamentId = parseInt(params.id);

    // Check if user is authorized (admin or referee)
    if (!["REFEREE", "TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Not authorized to create matches" },
        { status: 403 }
      );
    }

    // Get match data
    const {
      player1Id,
      player2Id,
      team1Id,
      team2Id,
      refereeId,
      startTime,
      round,
      courtNumber,
    } = await request.json();

    // Validate required fields
    if ((!player1Id || !player2Id) && (!team1Id || !team2Id)) {
      return NextResponse.json(
        { message: "Either players or teams must be specified" },
        { status: 400 }
      );
    }

    if (!round || !startTime) {
      return NextResponse.json(
        { message: "Round and start time are required" },
        { status: 400 }
      );
    }

    // Get referee ID if not provided
    let actualRefereeId = refereeId;
    if (!actualRefereeId && user.role === "REFEREE") {
      const referee = await prisma.referee.findUnique({
        where: { userId: user.id },
      });
      if (referee) {
        actualRefereeId = referee.id;
      } else {
        return NextResponse.json(
          { message: "Referee not found for this user" },
          { status: 404 }
        );
      }
    }

    if (!actualRefereeId) {
      return NextResponse.json(
        { message: "Referee ID is required" },
        { status: 400 }
      );
    }

    // Create the match
    const match = await prisma.match.create({
      data: {
        tournamentId,
        player1Id: player1Id || 0, // Default value if using teams
        player2Id: player2Id || 0, // Default value if using teams
        team1Id,
        team2Id,
        refereeId: actualRefereeId,
        startTime: new Date(startTime),
        round,
        status: "SCHEDULED",
        courtNumber,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
