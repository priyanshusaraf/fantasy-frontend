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
      return NextResponse.json({ assignments: [] });
    }

    // Fetch referee join requests for this referee
    const joinRequests = await prisma.refereeJoinRequest.findMany({
      where: { refereeId: referee.id },
      include: {
        tournament: {
          include: {
            tournamentAdmin: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format the response data
    const assignments = joinRequests.map(request => ({
      id: request.id,
      tournamentName: request.tournament.name,
      tournamentId: request.tournamentId,
      assignedBy: `${request.tournament.tournamentAdmin?.user?.name || 'Admin'} (TD)`,
      date: request.tournament.startDate.toISOString().split('T')[0],
      matchCount: 0, // We'll update this below if needed
      status: request.status,
    }));

    // For each assignment, count the number of matches assigned
    for (const assignment of assignments) {
      const matchCount = await prisma.match.count({
        where: {
          tournamentId: assignment.tournamentId,
          refereeId: referee.id,
        },
      });
      assignment.matchCount = matchCount;
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching referee assignments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 