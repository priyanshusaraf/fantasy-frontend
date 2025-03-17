import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get current user from session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Define the criteria for active contests
    const now = new Date();
    
    // Get active contests (contests that have started but not ended)
    const contests = await prisma.fantasyContest.findMany({
      where: {
        status: "IN_PROGRESS",
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        tournaments: {
          select: {
            id: true,
            name: true,
          }
        },
        teams: {
          where: userId ? {
            userId: userId
          } : undefined,
          select: {
            id: true,
            name: true,
            points: true,
          }
        },
        _count: {
          select: {
            teams: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });
    
    // Format the contests for the response
    const formattedContests = contests.map(contest => ({
      id: contest.id,
      name: contest.name,
      startDate: contest.startDate.toISOString(),
      endDate: contest.endDate.toISOString(),
      status: mapContestStatus(contest.status),
      prizePool: contest.prizePool,
      entryFee: contest.entryFee,
      maxTeams: contest.maxEntries,
      registeredTeams: contest._count.teams,
      tournaments: contest.tournaments,
      userTeam: contest.teams.length > 0 ? contest.teams[0] : null
    }));

    return NextResponse.json({
      contests: formattedContests
    });
  } catch (error) {
    console.error("Error fetching active contests:", error);
    return NextResponse.json(
      { error: "Failed to fetch active contests" },
      { status: 500 }
    );
  }
}

// Helper function to map database contest status to frontend status
function mapContestStatus(status: string): "upcoming" | "active" | "completed" {
  switch (status) {
    case "UPCOMING":
      return "upcoming";
    case "IN_PROGRESS":
      return "active";
    case "COMPLETED":
    case "CANCELLED":
      return "completed";
    default:
      return "upcoming";
  }
} 