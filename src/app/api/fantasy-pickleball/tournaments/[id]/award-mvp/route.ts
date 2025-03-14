// src/app/api/fantasy-pickleball/tournaments/[id]/award-mvp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { user } = request as any;
    const tournamentId = parseInt(params.id);

    // Only allow admins to award MVP
    if (!["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Not authorized to award MVP points" },
        { status: 403 }
      );
    }

    // Get data from request body
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { message: "Player ID is required" },
        { status: 400 }
      );
    }

    // Get tournament info
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        fantasyContests: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== "COMPLETED") {
      return NextResponse.json(
        { message: "Cannot award MVP until tournament is completed" },
        { status: 400 }
      );
    }

    // Process all teams in all contests for this tournament
    const contestIds = tournament.fantasyContests.map((contest) => contest.id);
    const MVPBonusPoints = 50;

    // Find all teams that included this player from day 1
    const teamsWithPlayer = await prisma.fantasyTeam.findMany({
      where: {
        contestId: { in: contestIds },
        players: {
          some: {
            playerId,
          },
        },
        // Must be created before or at tournament start
        createdAt: {
          lte: tournament.startDate,
        },
      },
      include: {
        players: {
          where: {
            playerId,
          },
        },
      },
    });

    // Award MVP points to qualifying teams
    const updatedTeams = await prisma.$transaction(
      teamsWithPlayer.map((team) =>
        prisma.fantasyTeam.update({
          where: { id: team.id },
          data: {
            totalPoints: {
              increment: team.players[0].isCaptain
                ? MVPBonusPoints * 2
                : team.players[0].isViceCaptain
                ? MVPBonusPoints * 1.5
                : MVPBonusPoints,
            },
          },
        })
      )
    );

    // Update rankings after points adjustment
    await prisma.$transaction(
      contestIds.map(
        (contestId) =>
          prisma.$executeRaw`
          UPDATE FantasyTeam ft1
          JOIN (
            SELECT id, RANK() OVER (ORDER BY totalPoints DESC) as new_rank
            FROM FantasyTeam
            WHERE contestId = ${contestId}
          ) ft2 ON ft1.id = ft2.id
          SET ft1.rank = ft2.new_rank
          WHERE ft1.contestId = ${contestId}
        `
      )
    );

    return NextResponse.json({
      success: true,
      message: `MVP bonus points awarded for player ${playerId}`,
      teamsAwarded: updatedTeams.length,
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
