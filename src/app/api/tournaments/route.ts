// src/app/api/tournaments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/services/tournament-service";
import { adminMiddleware } from "@/middleware/auth";
import { TournamentStatus, TournamentType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as TournamentStatus | undefined;
    const type = searchParams.get("type") as TournamentType | undefined;
    const search = searchParams.get("search") || undefined;

    // Get tournaments with filtering
    const tournamentsData = await TournamentService.listTournaments({
      page,
      limit,
      status,
      type,
      search,
    });

    return NextResponse.json(tournamentsData, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch tournaments",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admins can create tournaments
    const authResponse = await adminMiddleware(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    // Get tournament data from request
    const data = await request.json();

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const registrationOpenDate = new Date(data.registrationOpenDate);
    const registrationCloseDate = new Date(data.registrationCloseDate);

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      isNaN(registrationOpenDate.getTime()) ||
      isNaN(registrationCloseDate.getTime())
    ) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { message: "End date must be after start date" },
        { status: 400 }
      );
    }

    if (registrationOpenDate > registrationCloseDate) {
      return NextResponse.json(
        {
          message:
            "Registration close date must be after registration open date",
        },
        { status: 400 }
      );
    }

    if (registrationCloseDate > startDate) {
      return NextResponse.json(
        { message: "Registration must close before tournament starts" },
        { status: 400 }
      );
    }

    // Create tournament
    const tournament = await TournamentService.createTournament({
      name: data.name,
      location: data.location,
      description: data.description,
      type: data.type,
      status: data.status || "DRAFT",
      startDate,
      endDate,
      registrationOpenDate,
      registrationCloseDate,
      imageUrl: data.imageUrl,
      maxParticipants: data.maxParticipants,
      entryFee: data.entryFee,
      prizeMoney: data.prizeMoney,
      rules: data.rules,
      tournamentAdmin: {
        connect: { id: data.organizerId },
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      {
        message: "Failed to create tournament",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
