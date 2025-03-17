import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get referee ID
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user || (user.role !== "REFEREE" && user.role !== "ADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    
    // Find referee records
    const referee = await prisma.referee.findUnique({
      where: { userId: user.id },
    });

    if (!referee) {
      return NextResponse.json({ matches: [] });
    }

    // Base query conditions
    const whereConditions: any = {
      refereeId: referee.id,
    };

    if (status) {
      whereConditions.status = status;
    }

    // Fetch matches
    const matches = await prisma.match.findMany({
      where: whereConditions,
      include: {
        tournament: {
          select: {
            name: true,
          },
        },
        player1: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          }
        },
        player2: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          }
        },
        team1: true,
        team2: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Transform matches to expected format
    const formattedMatches = matches.map(match => {
      // Format team/player names
      let team1Name = "TBD";
      let team2Name = "TBD";
      
      if (match.team1) {
        team1Name = match.team1.name;
      } else if (match.player1) {
        team1Name = match.player1.user?.name || "Unknown";
      }
      
      if (match.team2) {
        team2Name = match.team2.name;
      } else if (match.player2) {
        team2Name = match.player2.user?.name || "Unknown";
      }
      
      return {
        id: match.id,
        tournamentName: match.tournament?.name || 'Unknown Tournament',
        matchNumber: match.id, // Using match ID as matchNumber
        team1: team1Name,
        team2: team2Name,
        court: match.courtNumber ? `Court ${match.courtNumber}` : 'TBD',
        startTime: match.startTime?.toISOString() || '',
        status: match.status,
      };
    });

    return NextResponse.json({ matches: formattedMatches });
  } catch (error) {
    console.error("Error fetching referee matches:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 