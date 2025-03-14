import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/lib/services/tournament-service";
import { TournamentSchema, CreateTournamentInput } from "@/lib/db/schema";
import { z } from "zod";
import {
  createValidationError,
  createAuthenticationError,
  convertToApiError,
} from "@/lib/utils/api-error";
import { authMiddleware } from "@/middleware/auth";

// Create Tournament
export async function POST(req: NextRequest) {
  try {
    // Apply auth middleware
    const authResult = authMiddleware(req);
    if (authResult.status !== 200) {
      throw createAuthenticationError("Authentication failed");
    }

    // Parse and validate request body
    const body = await req.json();

    // Use safeParse for more robust validation
    const validationResult = TournamentSchema.safeParse(body);
    if (!validationResult.success) {
      throw createValidationError(
        "Invalid tournament data",
        validationResult.error.flatten().fieldErrors
      );
    }

    // Create tournament
    const tournament = await TournamentService.createTournament(
      validationResult.data
    );

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    // Convert any error to a standardized API error
    const apiError = convertToApiError(error);

    return NextResponse.json(apiError.toResponse(), {
      status: apiError.status,
    });
  }
}

// List Tournaments
export async function GET(req: NextRequest) {
  try {
    // Apply auth middleware
    const authResult = authMiddleware(req);
    if (authResult.status !== 200) {
      throw createAuthenticationError("Authentication failed");
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      throw createValidationError("Invalid pagination parameters", {
        page: "Page must be 1 or greater",
        limit: "Limit must be 1 or greater",
      });
    }

    // Optional filters
    const filters = {
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
    };

    // Fetch tournaments
    const result = await TournamentService.listTournaments(
      page,
      limit,
      filters
    );

    return NextResponse.json(result);
  } catch (error) {
    // Convert any error to a standardized API error
    const apiError = convertToApiError(error);

    return NextResponse.json(apiError.toResponse(), {
      status: apiError.status,
    });
  }
}
