// src/app/api/players/[id]/performances/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get("contestId")
      ? parseInt(searchParams.get("contestId")!)
      : undefined;

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        {
          message: "Player not found",
        },
        { status: 404 }
      );
    }

    // Build query
    const where: any = {
      playerId,
    };

    // If contestId is provided, add tournament filter
    if (contestId) {
      const contest = await prisma.fantasyContest.findUnique({
        where: { id: contestId },
        select: { tournamentId: true },
      });

      if (!contest) {
        return NextResponse.json(
          {
            message: "Contest not found",
          },
          { status: 404 }
        );
      }

      where.match = {
        tournamentId: contest.tournamentId,
      };
    }

    // Get performances
    const performances = await prisma.matchPerformance.findMany({
      where,
      include: {
        match: {
          include: {
            player1: {
              select: {
                id: true,
                name: true,
              },
            },
            player2: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        match: {
          startTime: "desc",
        },
      },
    });

    // Get player points
    const playerPoints = await prisma.playerMatchPoints.findMany({
      where: {
        playerId,
        ...(contestId
          ? {
              match: {
                tournament: {
                  fantasyContests: {
                    some: {
                      id: contestId,
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        match: true,
      },
      orderBy: {
        match: {
          startTime: "desc",
        },
      },
    });

    return NextResponse.json({
      performances,
      points: playerPoints,
      total: {
        matchesPlayed: performances.length,
        totalPoints: playerPoints.reduce((sum, p) => sum + Number(p.points), 0),
      },
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
