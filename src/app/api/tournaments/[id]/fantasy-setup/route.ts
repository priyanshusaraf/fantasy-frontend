// src/app/api/tournaments/[id]/fantasy-setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const tournamentId = parseInt(params.id);
    const { user } = request as any;

    // Only tournament admin or master admin can configure fantasy settings
    if (!["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        {
          message: "Not authorized to configure fantasy settings",
        },
        { status: 403 }
      );
    }

    const settings = await request.json();

    // Validate tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tournamentAdmin: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        {
          message: "Tournament not found",
        },
        { status: 404 }
      );
    }

    // Check if user is the tournament admin
    if (
      tournament.tournamentAdmin.userId !== user.id &&
      user.role !== "MASTER_ADMIN"
    ) {
      return NextResponse.json(
        {
          message:
            "Not authorized to configure fantasy settings for this tournament",
        },
        { status: 403 }
      );
    }

    // Store settings in database
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        fantasySettings: JSON.stringify(settings),
      },
    });

    // Create contests based on entry fee settings if they don't exist
    if (settings.entryFees) {
      const entryFeeMap = {
        free: 0,
        basic: 500,
        premium: 1000,
        elite: 1500,
      };

      const contestPromises = Object.entries(settings.entryFees)
        .filter(([key, enabled]) => enabled)
        .map(async ([key, _]) => {
          const entryFee = entryFeeMap[key as keyof typeof entryFeeMap];
          const contestName =
            entryFee > 0
              ? `${tournament.name} - ${
                  key.charAt(0).toUpperCase() + key.slice(1)
                }`
              : `${tournament.name} - Free Entry`;

          // Check if contest already exists
          const existingContest = await prisma.fantasyContest.findFirst({
            where: {
              tournamentId,
              name: contestName,
            },
          });

          if (!existingContest) {
            return prisma.fantasyContest.create({
              data: {
                name: contestName,
                tournamentId,
                entryFee,
                prizePool: entryFee * 0.8,
                maxEntries: 100,
                currentEntries: 0,
                startDate: new Date(tournament.startDate),
                endDate: new Date(tournament.endDate),
                status: "UPCOMING",
                rules: JSON.stringify({
                  ...settings,
                  contestType: key,
                }),
              },
            });
          }
        });

      await Promise.all(contestPromises);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id);

    // Fetch tournament fantasy settings
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        fantasySettings: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        {
          message: "Tournament not found",
        },
        { status: 404 }
      );
    }

    // Parse fantasy settings
    let settings = {};
    try {
      if (tournament.fantasySettings) {
        settings = JSON.parse(tournament.fantasySettings as string);
      }
    } catch (e) {
      console.error("Error parsing fantasy settings:", e);
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
