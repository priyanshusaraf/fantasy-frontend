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
 * Get all fantasy contests for a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    console.log("Checking authentication for contests request");
    
    // In development mode, we allow read-only operations without strict auth
    // The auth middleware will handle this check
    const authResult = await authMiddleware(request);
    
    // If auth failed and not in development mode (middleware should handle dev mode)
    if (authResult.status !== 200 && !(authResult instanceof NextResponse && authResult.status === undefined)) {
      console.error("Authentication failed with status:", authResult.status);
      
      // Print the error details if possible
      try {
        console.error("Auth error details:", await authResult.text());
      } catch (e) {
        console.error("Could not read error details");
      }
      
      return authResult;
    }
    
    console.log("Authentication successful or bypassed in development mode");

    // Extract the ID from the URL directly to avoid params issue
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idFromPath = pathParts.find((part, index) => 
      pathParts[index-1] === "tournaments" && part !== "contests"
    );
    
    if (!idFromPath || isNaN(parseInt(idFromPath))) {
      console.error("Invalid tournament ID from path:", idFromPath);
      console.error("URL path parts:", pathParts);
      return NextResponse.json(
        { message: "Invalid tournament ID", path: url.pathname, pathParts },
        { status: 400 }
      );
    }
    
    const tournamentId = parseInt(idFromPath);
    console.log(`Fetching contests for tournament: ${tournamentId} (URL path: ${url.pathname})`);

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    }) as TournamentWithAny | null;

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      // Check if tournament exists at all
      const anyTournament = await prisma.tournament.findFirst({
        select: { id: true }
      });
      console.log(`Database check - any tournament exists: ${anyTournament ? 'Yes' : 'No'}`);
      
      return NextResponse.json(
        { message: "Tournament not found", tournamentId },
        { status: 404 }
      );
    }

    console.log(`Found tournament: ${tournament.id} - ${tournament.name}`);
    
    // For debugging, log the exact SQL query that would be executed
    console.log("SQL QUERY PREVIEW:", Prisma.sql`
      SELECT * FROM "FantasyContest" 
      WHERE "tournamentId" = ${tournamentId}
      ORDER BY "createdAt" DESC
    `.sql);
    
    // Check if this is a force refresh request
    const forceRefresh = request.nextUrl.searchParams.get("force") === "true";
    if (forceRefresh) {
      console.log("FORCE REFRESH requested - bypassing all caches");
    }
    
    // Parse fantasy settings if available
    let fantasySettings = null;
    let fantasyEnabled = false;
    
    try {
      if (tournament['fantasySettings']) {
        console.log("Raw fantasy settings:", tournament['fantasySettings']);
        fantasySettings = JSON.parse(tournament['fantasySettings'] as string);
        console.log("Parsed fantasy settings:", JSON.stringify(fantasySettings, null, 2));
        fantasyEnabled = !!fantasySettings?.enableFantasy;
      } else {
        console.log("No fantasy settings found for tournament");
      }
    } catch (e) {
      console.error("Error parsing fantasy settings:", e);
      console.error("Raw settings that failed to parse:", tournament['fantasySettings']);
    }

    console.log("Fantasy enabled for tournament:", fantasyEnabled);

    // Get all contests for this tournament
    console.log(`Querying contests for tournament ID: ${tournamentId}`);
    
    // Define contests with proper type from Prisma schema
    let contests: any[] = [];
    try {
      contests = await prisma.fantasyContest.findMany({
        where: {
          tournamentId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`Found ${contests.length} contests for tournament ${tournamentId}`);
      
      // Detailed debugging of found contests
      if (contests.length > 0) {
        console.log("Raw first contest data:", JSON.stringify(contests[0], null, 2));
        console.log("Tournament ID from first contest:", contests[0].tournamentId);
        console.log("Contest name from first contest:", contests[0].name);
      } else {
        // Double-check there are no contests at all for this tournament
        console.log("No contests found - performing detailed checks");
        
        // Check if the tournamentId is correct format
        console.log(`Tournament ID being queried: ${tournamentId}, Type: ${typeof tournamentId}`);
        
        const countCheck = await prisma.fantasyContest.count({
          where: { tournamentId }
        });
        console.log(`Double-check contest count: ${countCheck}`);
        
        // Try a different query to ensure the DB is working
        const allContests = await prisma.fantasyContest.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' }
        });
        console.log(`Total contests in database: ${allContests.length}`);
        
        if (allContests.length > 0) {
          console.log("Sample contest from DB:", JSON.stringify(allContests[0], null, 2));
          console.log("Sample contest tournament ID:", allContests[0].tournamentId);
          console.log("Sample contest tournament ID type:", typeof allContests[0].tournamentId);
        }
        
        // If fantasy is enabled but no contests, this might be an issue
        if (fantasyEnabled && countCheck === 0) {
          console.warn("Fantasy is enabled but no contests found - this might indicate a problem");
        }
      }
    } catch (queryError) {
      console.error("Error querying contests:", queryError);
      // Continue execution with empty contests array
    }

    // Transform contests to include parsed rules
    const transformedContests = contests.map(contest => {
      let rules = {};
      try {
        if (contest.rules) {
          console.log(`Parsing rules for contest ${contest.id}`);
          rules = JSON.parse(contest.rules as string);
        }
      } catch (e) {
        console.error(`Failed to parse rules for contest ${contest.id}:`, e);
        console.error("Raw rules that failed to parse:", contest.rules);
      }

      return {
        id: contest.id,
        name: contest.name,
        entryFee: contest.entryFee,
        maxEntries: contest.maxEntries,
        totalPrize: contest.prizePool,
        currentEntries: contest.currentEntries,
        status: contest.status,
        description: contest.description,
        startDate: contest.startDate,
        endDate: contest.endDate,
        ...rules
      };
    });

    // Return with explicit no-cache headers
    const response = NextResponse.json({ 
      contests: transformedContests,
      count: transformedContests.length,
      tournamentId,
      fantasyEnabled,
      timestamp: new Date().toISOString(),
      success: true,
      forcedRefresh: forceRefresh,
      message: transformedContests.length > 0 
        ? `Found ${transformedContests.length} contests`
        : "No contests found for this tournament"
    });
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error fetching tournament contests:", error);
    return errorHandler(error as Error, request);
  }
} 