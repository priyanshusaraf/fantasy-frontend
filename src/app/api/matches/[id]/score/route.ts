// src/app/api/matches/[id]/score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";
import { ScoringService } from "@/lib/services/scoring-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const matchId = parseInt(params.id);
    const { user } = request as any;

    // Get request data
    const { player1Score, player2Score, status } = await request.json();

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        referee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          message: "Match not found",
        },
        { status: 404 }
      );
    }

    // src/app/api/matches/[id]/score/route.ts (continued)
    // Check if user is the referee
    if (match.referee.user.id !== user.id && user.role !== "MASTER_ADMIN") {
      return NextResponse.json(
        {
          message: "You are not authorized to update this match",
        },
        { status: 403 }
      );
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        player1Score,
        player2Score,
        status,
      },
    });

    // If match is completed, calculate points
    if (status === "COMPLETED") {
      const pointsResult = await ScoringService.calculateMatchPoints(matchId);

      return NextResponse.json({
        match: updatedMatch,
        points: pointsResult,
      });
    }

    return NextResponse.json(updatedMatch);
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
