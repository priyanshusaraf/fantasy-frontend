import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorHandler } from "@/middleware/error-handler";
import { authMiddleware } from "@/middleware/auth";
import { Tournament } from "@prisma/client";
import { Prisma } from "@prisma/client";

// Add the custom type for Tournament with indexed access
interface TournamentWithAny extends Tournament {
  [key: string]: any;
}

/**
 * GET /api/tournaments/[id]/contests
 * Get all contests associated with a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tournamentId = parseInt(id);
    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Check for force refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";
    console.log(`Fetching contests for tournament ${tournamentId}, force refresh: ${forceRefresh}`);

    // Fetch all contests for this tournament
    const contests = await prisma.fantasyContest.findMany({
      where: {
        tournamentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${contests.length} contests for tournament ${tournamentId}`);

    // Map and transform contests for client consumption
    const transformedContests = contests.map((contest) => {
      // Parse rules from JSON string to object
      let rules = {};
      if ((contest as any).rules && typeof (contest as any).rules === "string") {
        try {
          rules = JSON.parse((contest as any).rules);
        } catch (e) {
          console.error("Error parsing contest rules:", e);
        }
      }

      return {
        ...contest,
        rules,
      };
    });

    // Create the response object
    const response = NextResponse.json({ contests: transformedContests });
    
    // Set appropriate cache control headers based on force parameter
    if (forceRefresh) {
      // No caching when force refresh is requested
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
      response.headers.set('X-Data-Timestamp', new Date().toISOString());
    } else {
      // Limited caching (30 seconds) for normal requests
      response.headers.set('Cache-Control', 'public, max-age=30');
    }
    
    return response;
  } catch (error) {
    console.error("Error fetching contests:", error);
    return errorHandler(error as Error, request);
  }
} 