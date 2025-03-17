import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['TOURNAMENT_ADMIN', 'MASTER_ADMIN'].includes(session.user.role as string)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { name, playerIds, tournamentId } = body;

    if (!name || !tournamentId || !playerIds || !Array.isArray(playerIds)) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    // Check if the tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: Number(tournamentId) },
    });

    if (!tournament) {
      return new NextResponse('Tournament not found', { status: 404 });
    }

    // Create the team
    const team = await prisma.team.create({
      data: {
        name,
        players: {
          connect: playerIds.map(id => ({ id: Number(id) }))
        },
        tournament: {
          connect: { id: Number(tournamentId) }
        }
      },
    });

    // Fetch the complete team with players to return
    const teamWithPlayers = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        players: true,
      },
    });

    return NextResponse.json(teamWithPlayers);
  } catch (error) {
    console.error('Error creating team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 