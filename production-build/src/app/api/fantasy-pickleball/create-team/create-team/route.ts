// src/app/api/fantasy-pickleball/create-team/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FantasyService } from "@/lib/services/fantasy-service";
import { authMiddleware } from "@/middleware/auth";

export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const authResponse = await authMiddleware(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    // Get the authenticated user ID
    const requestWithUser = request as NextRequest & { user: { id: number } };
    const userId = requestWithUser.user.id;

    // Get team data from request
    const data = await request.json();

    // Validate the required fields
    if (
      !data.contestId ||
      !data.name ||
      !data.players ||
      data.players.length === 0
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate players array
    if (!Array.isArray(data.players)) {
      return NextResponse.json(
        { message: "Players must be an array" },
        { status: 400 }
      );
    }

    // Create the team
    const team = await FantasyService.createTeam({
      userId,
      contestId: data.contestId,
      name: data.name,
      players: data.players.map((player) => ({
        playerId: player.playerId,
        isCaptain: player.isCaptain || false,
        isViceCaptain: player.isViceCaptain || false,
      })),
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Error creating fantasy team:", error);

    // Return helpful error messages for known errors
    if (error instanceof Error) {
      const errorMessage = error.message;

      if (
        errorMessage.includes("Contest is full") ||
        errorMessage.includes("You already have a team") ||
        errorMessage.includes("You must select exactly one captain") ||
        errorMessage.includes("Captain and vice-captain must be different")
      ) {
        return NextResponse.json({ message: errorMessage }, { status: 400 });
      }

      if (errorMessage.includes("Contest not found")) {
        return NextResponse.json(
          { message: "Contest not found" },
          { status: 404 }
        );
      }
    }

    // Generic error
    return NextResponse.json(
      {
        message: "Failed to create fantasy team",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
