import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createValidationError,
  createAuthenticationError,
  convertToApiError,
} from "@/lib/utils/api-error";
import { FantasyTeamService } from "@/lib/services/fantasy-team-service";
import { authMiddleware } from "@/middleware/auth";

// Input validation schema
const CreateFantasyTeamSchema = z.object({
  teamName: z
    .string()
    .min(3, { message: "Team name must be at least 3 characters" })
    .max(50, { message: "Team name cannot exceed 50 characters" }),
  selectedPlayers: z
    .array(z.number().int())
    .min(1, { message: "At least one player must be selected" })
    .max(10, { message: "Cannot select more than 10 players" }),
  leagueId: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply authentication middleware
    const authResult = authMiddleware(request);
    if (authResult.status !== 200) {
      throw createAuthenticationError(
        "Authentication required to create a fantasy team"
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = CreateFantasyTeamSchema.safeParse(body);
    if (!validationResult.success) {
      throw createValidationError(
        "Invalid fantasy team data",
        validationResult.error.flatten().fieldErrors
      );
    }

    // Extract validated data
    const { teamName, selectedPlayers, leagueId } = validationResult.data;

    // Get authenticated user ID
    const userId = (request as any).user?.id;
    if (!userId) {
      throw createAuthenticationError("User ID not found");
    }

    // Create fantasy team
    const team = await FantasyTeamService.createTeam({
      userId,
      teamName,
      players: selectedPlayers,
      leagueId,
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    // Convert any error to a standardized API error
    const apiError = convertToApiError(error);

    return NextResponse.json(apiError.toResponse(), {
      status: apiError.status,
    });
  }
}
