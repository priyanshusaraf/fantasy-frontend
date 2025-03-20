import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/index";

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

    // Get the referee record
    const referee = await prisma.referee.findUnique({
      where: { userId: user.id },
    });

    if (!referee) {
      return NextResponse.json({ matches: [] });
    }

    // Fetch completed matches for this referee
    const matches = await prisma.match.findMany({
      where: {
        refereeId: referee.id,
        status: {
          in: ["COMPLETED", "CANCELLED", "DISPUTED"],
        },
      },
      include: {
        tournament: {
          select: {
            name: true,
          },
        },
        team1: true,
        team2: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    console.log(`Found ${matches.length} match history records for referee ID ${referee.id}`);

    // Transform matches to the expected format
    const formattedMatches = matches.map(match => {
      // Format team names
      const team1Name = match.team1?.name || "Team 1";
      const team2Name = match.team2?.name || "Team 2";
      
      // Determine winner
      let winner = "";
      if (match.status === "COMPLETED") {
        if (match.player1Score > match.player2Score) {
          winner = team1Name;
        } else if (match.player2Score > match.player1Score) {
          winner = team2Name;
        } else {
          winner = "Draw";
        }
      }
      
      // Calculate duration if available
      let duration = "N/A";
      if (match.startTime && match.endTime) {
        const durationMs = match.endTime.getTime() - match.startTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        duration = `${durationMinutes} minutes`;
      } else if (match.matchDuration) {
        duration = `${match.matchDuration} minutes`;
      }
      
      // Format date and time
      const dateStr = match.startTime ? match.startTime.toISOString().split('T')[0] : '';
      const timeStr = match.startTime ? 
        match.startTime.toTimeString().split(' ')[0].substring(0, 5) : '';
      
      return {
        id: match.id,
        tournamentName: match.tournament?.name || 'Unknown Tournament',
        tournamentId: match.tournamentId,
        matchNumber: `Match #${match.id}`,
        round: match.round || 'Unknown Round',
        court: `Court ${match.courtNumber || '?'}`,
        date: dateStr,
        time: timeStr,
        team1: team1Name,
        team2: team2Name,
        score1: match.player1Score || 0,
        score2: match.player2Score || 0,
        winner: winner,
        status: match.status as any,
        duration: duration,
      };
    });

    return NextResponse.json({ matches: formattedMatches });
  } catch (error) {
    console.error("Error fetching referee match history:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 