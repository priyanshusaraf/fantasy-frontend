import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
        playerPoints: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
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

    // Get the last point entry
    const lastPoint = match.playerPoints[0];
    if (!lastPoint) {
      return new NextResponse('No points to undo', { status: 400 });
    }

    // Start a transaction to ensure data consistency
    const updatedMatch = await prisma.$transaction(async (tx) => {
      // Delete the last point
      await tx.playerMatchPoints.delete({
        where: {
          id: lastPoint.id,
        },
      });

      // First get the current match state
      const currentMatch = await tx.match.findUnique({
        where: { id: matchId },
        select: {
          player1Score: true,
          player2Score: true,
        },
      });

      if (!currentMatch) {
        throw new Error('Match not found during update');
      }

      // Calculate new scores
      const pointsToRemove = Number(lastPoint.points);
      const newPlayer1Score = lastPoint.playerId === match.player1Id
        ? (currentMatch.player1Score || 0) - pointsToRemove
        : currentMatch.player1Score;
      const newPlayer2Score = lastPoint.playerId === match.player2Id
        ? (currentMatch.player2Score || 0) - pointsToRemove
        : currentMatch.player2Score;

      // Update with new scores
      return tx.match.update({
        where: { id: matchId },
        data: {
          player1Score: newPlayer1Score,
          player2Score: newPlayer2Score,
        },
        include: {
          playerPoints: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
        },
      });
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Error undoing match score:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 