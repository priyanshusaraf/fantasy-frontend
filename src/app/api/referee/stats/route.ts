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

    // Get the referee record
    const referee = await prisma.referee.findUnique({
      where: { userId: user.id },
    });

    if (!referee) {
      return NextResponse.json({
        totalMatches: 0,
        monthlyMatches: 0,
        averageMatchTime: "0hr 0min",
        tournamentCount: 0,
      });
    }

    // Get total matches officiated
    const totalMatches = await prisma.match.count({
      where: {
        refereeId: referee.id,
      },
    });

    // Get matches this month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyMatches = await prisma.match.count({
      where: {
        refereeId: referee.id,
        startTime: {
          gte: firstDayOfMonth,
        },
      },
    });

    // Get average match duration
    const completedMatches = await prisma.match.findMany({
      where: {
        refereeId: referee.id,
        status: "COMPLETED",
        matchDuration: {
          not: null,
        },
      },
      select: {
        matchDuration: true,
      },
    });

    let averageMinutes = 0;
    if (completedMatches.length > 0) {
      const totalDuration = completedMatches.reduce((sum, match) => sum + (match.matchDuration || 0), 0);
      averageMinutes = Math.round(totalDuration / completedMatches.length);
    }

    const hours = Math.floor(averageMinutes / 60);
    const minutes = averageMinutes % 60;
    const averageMatchTime = `${hours}hr ${minutes}min`;

    // Get tournament count
    const tournamentCount = await prisma.tournament.count({
      where: {
        matches: {
          some: {
            refereeId: referee.id,
          },
        },
      },
    });

    return NextResponse.json({
      totalMatches,
      monthlyMatches,
      averageMatchTime,
      tournamentCount,
    });
  } catch (error) {
    console.error("Error fetching referee stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 