import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get a specific team
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new NextResponse('Invalid team ID', { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: true,
        tournament: true,
      },
    });

    if (!team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Update a team
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['TOURNAMENT_ADMIN', 'MASTER_ADMIN'].includes(session.user.role as string)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new NextResponse('Invalid team ID', { status: 400 });
    }

    const body = await req.json();
    const { name, playerIds } = body;

    if (!name || !Array.isArray(playerIds)) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    // Verify the team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id },
      include: { players: true }
    });

    if (!existingTeam) {
      return new NextResponse('Team not found', { status: 404 });
    }

    // Get current player IDs
    const currentPlayerIds = existingTeam.players.map(player => player.id);
    
    // Determine which players to disconnect and connect
    const playerIdsToAdd = playerIds.filter(id => !currentPlayerIds.includes(Number(id)));
    const playerIdsToRemove = currentPlayerIds.filter(id => !playerIds.includes(id));

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name,
        players: {
          disconnect: playerIdsToRemove.map(id => ({ id })),
          connect: playerIdsToAdd.map(id => ({ id: Number(id) })),
        },
      },
      include: {
        players: true,
        tournament: true,
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Delete a team
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['TOURNAMENT_ADMIN', 'MASTER_ADMIN'].includes(session.user.role as string)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new NextResponse('Invalid team ID', { status: 400 });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    // Delete the team
    await prisma.team.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 