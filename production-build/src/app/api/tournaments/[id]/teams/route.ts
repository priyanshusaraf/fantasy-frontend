import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get teams for a specific tournament
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new NextResponse('Invalid tournament ID', { status: 400 });
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return new NextResponse('Tournament not found', { status: 404 });
    }

    // Get all teams for the tournament with their players
    const teams = await prisma.team.findMany({
      where: { 
        tournamentId: id 
      } as any, // Type assertion to bypass TypeScript check
      include: {
        players: {
          select: {
            id: true,
            name: true,
            skillLevel: true,
            country: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching tournament teams:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 