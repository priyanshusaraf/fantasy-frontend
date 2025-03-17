// src/app/api/matches/[id]/score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";
import { ScoringService } from "@/lib/services/scoring-service";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return new NextResponse('Invalid match ID', { status: 400 });
    }

    // Get the match and verify the referee
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
      },
    });

    if (!match) {
      return new NextResponse('Match not found', { status: 404 });
    }

    // Convert session.user.id to number for comparison
    const refereeId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
    if (match.refereeId !== refereeId) {
      return new NextResponse('Unauthorized: Not the match referee', { status: 403 });
    }

    if (match.status !== 'IN_PROGRESS') {
      return new NextResponse('Match is not in progress', { status: 400 });
    }

    const body = await request.json();
    const { teamNumber, points } = body;

    if (!teamNumber || !points || ![1, 2].includes(teamNumber)) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    // Update the score
    const updateData = teamNumber === 1
      ? { player1Score: { increment: points } }
      : { player2Score: { increment: points } };

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        ...updateData,
        playerPoints: {
          create: {
            playerId: teamNumber === 1 ? match.player1Id : match.player2Id,
            points: points,
            createdAt: new Date(),
          },
        },
      },
      include: {
        playerPoints: true,
      },
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match score:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
