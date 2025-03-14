// src/app/api/fantasy-pickleball/user/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { user } = request as any;

    // Get all teams for the user
    const teams = await prisma.fantasyTeam.findMany({
      where: {
        userId: user.id,
      },
      include: {
        contest: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                status: true,
                imageUrl: true,
              },
            },
          },
        },
        players: {
          include: {
            player: true,
          },
        },
        _count: {
          select: { players: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group teams by tournament and contest
    const groupedTeams = teams.reduce((acc, team) => {
      const tournamentId = team.contest.tournament.id;

      if (!acc[tournamentId]) {
        acc[tournamentId] = {
          tournament: team.contest.tournament,
          contests: {},
        };
      }

      const contestId = team.contest.id;
      if (!acc[tournamentId].contests[contestId]) {
        acc[tournamentId].contests[contestId] = {
          contest: team.contest,
          teams: [],
        };
      }

      acc[tournamentId].contests[contestId].teams.push(team);

      return acc;
    }, {} as Record<number, any>);

    return NextResponse.json(
      {
        teams,
        groupedTeams: Object.values(groupedTeams),
      },
      { status: 200 }
    );
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
