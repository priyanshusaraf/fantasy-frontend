// src/app/api/players/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/player-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

interface Params {
  id: string;
}

// Helper function to check if user is admin
async function checkAdminStatus(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Check if user is an admin
  if (
    session.user.role !== "MASTER_ADMIN" &&
    session.user.role !== "TOURNAMENT_ADMIN"
  ) {
    return NextResponse.json(
      { message: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid player ID" },
        { status: 400 }
      );
    }

    const player = await PlayerService.getPlayerById(id);

    if (!player) {
      return NextResponse.json(
        { message: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(player, { status: 200 });
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { message: "Failed to fetch player", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Only admins can update players
    const authResponse = await checkAdminStatus(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid player ID" },
        { status: 400 }
      );
    }

    // Get update data from request
    const updateData = await request.json();

    // Update player
    const updatedPlayer = await PlayerService.updatePlayer(id, updateData);

    if (!updatedPlayer) {
      return NextResponse.json(
        { message: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPlayer, { status: 200 });
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { message: "Failed to update player", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Only admins can delete players
    const authResponse = await checkAdminStatus(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid player ID" },
        { status: 400 }
      );
    }

    // Try to delete player
    const success = await PlayerService.deletePlayer(id);

    if (!success) {
      return NextResponse.json(
        { message: "Failed to delete player" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Player deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { message: "Failed to delete player", error: (error as Error).message },
      { status: 500 }
    );
  }
}
