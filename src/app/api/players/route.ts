// src/app/api/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/player-service";
import { adminMiddleware } from "@/middleware/auth";
import { PlayerSkillLevel } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const isActive =
      searchParams.get("isActive") === "true"
        ? true
        : searchParams.get("isActive") === "false"
        ? false
        : undefined;
    const country = searchParams.get("country") || undefined;
    const search = searchParams.get("search") || undefined;
    const skillLevel = searchParams.get("skillLevel") as
      | PlayerSkillLevel
      | undefined;

    // Get players with filtering
    const playersData = await PlayerService.listPlayers({
      page,
      limit,
      isActive,
      country,
      search,
      skillLevel,
    });

    return NextResponse.json(playersData, { status: 200 });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { message: "Failed to fetch players", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admins can create players
    const authResponse = await adminMiddleware(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    // Get player data from request
    const playerData = await request.json();

    // Create player using the service
    const player = await PlayerService.createPlayer({
      name: playerData.name,
      imageUrl: playerData.imageUrl,
      age: playerData.age,
      country: playerData.country,
      skillLevel: playerData.skillLevel,
      dominantHand: playerData.dominantHand,
      rank: playerData.rank,
      tournamentWins: playerData.tournamentWins || 0,
      careerWinRate: playerData.careerWinRate || 0,
      bio: playerData.bio,
      isActive: playerData.isActive !== undefined ? playerData.isActive : true,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { message: "Failed to create player", error: (error as Error).message },
      { status: 500 }
    );
  }
}
