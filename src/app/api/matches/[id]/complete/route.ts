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
        tournament: true,
        playerPoints: true,
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

    // Validate final scores
    if (match.player1Score === null || match.player2Score === null) {
      return new NextResponse('Match scores are not properly set', { status: 400 });
    }

    const player1Score = match.player1Score;
    const player2Score = match.player2Score;

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update match status and end time
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
        },
      });

      // Calculate player statistics
      const winner = player1Score > player2Score ? match.player1Id : match.player2Id;
      const loser = winner === match.player1Id ? match.player2Id : match.player1Id;

      // Update winner stats
      const winnerPoints = player1Score > player2Score ? player1Score : player2Score;
      const winnerPointsAgainst = player1Score > player2Score ? player2Score : player1Score;

      // Find or create winner stats
      const existingWinnerStats = await tx.playerStats.findFirst({
        where: {
          playerId: winner,
          tournamentId: match.tournamentId,
        },
      });

      if (existingWinnerStats) {
        await tx.playerStats.update({
          where: { id: existingWinnerStats.id },
          data: {
            wins: { increment: 1 },
            pointsScored: winnerPoints,
            pointsAgainst: winnerPointsAgainst,
          },
        });
      } else {
        await tx.playerStats.create({
          data: {
            playerId: winner,
            tournamentId: match.tournamentId,
            wins: 1,
            losses: 0,
            pointsScored: winnerPoints,
            pointsAgainst: winnerPointsAgainst,
          },
        });
      }

      // Update loser stats
      const loserPoints = player1Score < player2Score ? player1Score : player2Score;
      const loserPointsAgainst = player1Score < player2Score ? player2Score : player1Score;

      // Find or create loser stats
      const existingLoserStats = await tx.playerStats.findFirst({
        where: {
          playerId: loser,
          tournamentId: match.tournamentId,
        },
      });

      if (existingLoserStats) {
        await tx.playerStats.update({
          where: { id: existingLoserStats.id },
          data: {
            losses: { increment: 1 },
            pointsScored: loserPoints,
            pointsAgainst: loserPointsAgainst,
          },
        });
      } else {
        await tx.playerStats.create({
          data: {
            playerId: loser,
            tournamentId: match.tournamentId,
            wins: 0,
            losses: 1,
            pointsScored: loserPoints,
            pointsAgainst: loserPointsAgainst,
          },
        });
      }

      return updatedMatch;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error completing match:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 