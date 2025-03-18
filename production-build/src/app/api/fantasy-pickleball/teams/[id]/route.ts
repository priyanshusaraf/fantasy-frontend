// src/app/api/fantasy-pickleball/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = parseInt(params.id);

    // Get team details with related data
    const team = await prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        contest: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                status: true,
              },
            },
          },
        },
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          message: "Team not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ team }, { status: 200 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const teamId = parseInt(params.id);
    const { user } = request as any;

    // Get team
    const team = await prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      include: {
        contest: {
          include: {
            tournament: true,
          },
        },
        players: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          message: "Team not found",
        },
        { status: 404 }
      );
    }

    // Check if user owns this team
    if (team.userId !== user.id) {
      return NextResponse.json(
        {
          message: "You don't have permission to update this team",
        },
        { status: 403 }
      );
    }

    // Get request data
    const { name, playerChanges } = await request.json();

    // Parse contest rules
    let rules = {};
    try {
      rules =
        typeof team.contest.rules === "string"
          ? JSON.parse(team.contest.rules)
          : team.contest.rules || {};
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }

    // Check if team changes are allowed
    if (!(rules as any).allowTeamChanges) {
      return NextResponse.json(
        {
          message: "Team changes are not allowed for this contest",
        },
        { status: 400 }
      );
    }

    // Check if tournament has started
    const now = new Date();
    const tournamentStartDate = new Date(team.contest.tournament.startDate);
    const tournamentEndDate = new Date(team.contest.tournament.endDate);

    // If tournament hasn't started yet, allow all changes
    if (now < tournamentStartDate) {
      // Update team name if provided
      if (name) {
        await prisma.fantasyTeam.update({
          where: { id: teamId },
          data: { name },
        });
      }

      // Process player changes if provided
      if (playerChanges && playerChanges.length > 0) {
        // Implement full team edit logic here
        // This could involve removing all current players and adding new ones
      }
    }
    // If tournament has ended, deny changes
    else if (now > tournamentEndDate) {
      return NextResponse.json(
        {
          message: "Tournament has ended. Team changes are not allowed",
        },
        { status: 400 }
      );
    }
    // Tournament is in progress, check for change window
    else {
      // Check if we're in the allowed change window time
      if ((rules as any).changeWindowStart && (rules as any).changeWindowEnd) {
        const timeString =
          now.getHours().toString().padStart(2, "0") +
          ":" +
          now.getMinutes().toString().padStart(2, "0");

        if (
          timeString < (rules as any).changeWindowStart ||
          timeString > (rules as any).changeWindowEnd
        ) {
          return NextResponse.json(
            {
              message: `Team changes are only allowed between ${
                (rules as any).changeWindowStart
              } and ${(rules as any).changeWindowEnd}`,
            },
            { status: 400 }
          );
        }
      }

      // Check change frequency
      if ((rules as any).changeFrequency === "once") {
        // Check if team has been updated before
        if (team.updatedAt > tournamentStartDate) {
          return NextResponse.json(
            {
              message:
                "You can only change your team once during the tournament",
            },
            { status: 400 }
          );
        }
      }

      // Implement limited changes logic based on rules
      if (playerChanges && playerChanges.length > 0) {
        const maxChanges = (rules as any).maxPlayersToChange || 2;
        if (playerChanges.length > maxChanges) {
          return NextResponse.json(
            {
              message: `You can only change up to ${maxChanges} players at a time`,
            },
            { status: 400 }
          );
        }

        // Process the allowed changes
        // Implementation depends on exact structure of playerChanges
      }
    }

    // Return updated team
    const updatedTeam = await prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    return NextResponse.json({ team: updatedTeam }, { status: 200 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
