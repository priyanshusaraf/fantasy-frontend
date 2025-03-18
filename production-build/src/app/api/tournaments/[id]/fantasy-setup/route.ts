// src/app/api/tournaments/[id]/fantasy-setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";
import { ContestStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    console.log("Checking authentication for fantasy-setup request");
    const authResult = await authMiddleware(request);
    
    // If auth failed and not an expected NextResponse (which would mean it was allowed through)
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
      pathParts[index-1] === "tournaments" && part !== "fantasy-setup"
    );
    
    if (!idFromPath || isNaN(parseInt(idFromPath))) {
      console.error("Invalid tournament ID from path:", idFromPath);
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }
    
    const tournamentId = parseInt(idFromPath);
    console.log(`Saving fantasy settings for tournament: ${tournamentId}`);

    // Get user from request
    let { user } = request as any;
    console.log("User from auth middleware:", user?.id, user?.email, user?.role);
    
    // If user is not set properly (happens in development sometimes), use a default admin user
    if (!user || !user.role) {
      console.warn("User not properly set from auth middleware - using default admin user for development");
      // Only do this in development
      if (process.env.NODE_ENV !== 'production') {
        user = {
          id: 1,
          email: 'admin@example.com',
          role: 'MASTER_ADMIN'
        };
        console.log("Using default admin user:", user);
      } else {
        console.error("User role not authorized: undefined");
        return NextResponse.json(
          {
            message: "Not authorized to configure fantasy settings",
          },
          { status: 403 }
        );
      }
    }

    // Only tournament admin or master admin can configure fantasy settings
    if (!["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      console.error("User role not authorized:", user.role);
      return NextResponse.json(
        {
          message: "Not authorized to configure fantasy settings",
        },
        { status: 403 }
      );
    }

    const settings = await request.json();
    console.log("Received fantasy settings:", JSON.stringify(settings, null, 2));

    // Validate tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tournamentAdmin: true,
      },
    });

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
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
      console.error(`User ${user.id} not authorized for tournament ${tournamentId}`);
      return NextResponse.json(
        {
          message:
            "Not authorized to configure fantasy settings for this tournament",
        },
        { status: 403 }
      );
    }

    // Make sure enableFantasy is true if it exists in the settings
    if (settings.enableFantasy !== undefined) {
      settings.enableFantasy = Boolean(settings.enableFantasy);
      console.log("Ensured enableFantasy is a boolean:", settings.enableFantasy);
    }

    // Store settings in a separate fantasySettings field in tournament table
    // This prevents overwriting the rules field which might contain tournament rules
    console.log("Storing fantasy settings separately in the database");
    try {
      // Use executeRaw to update the fantasySettings field directly
      // This avoids the type error since fantasySettings is not in the Prisma schema
      const settingsJson = JSON.stringify({
        enableFantasy: settings.enableFantasy,
        fantasyPoints: settings.fantasyPoints,
        autoPublish: settings.autoPublish,
        customPoints: settings.customPoints
      });
      
      await prisma.$executeRaw`
        UPDATE \`Tournament\`
        SET \`fantasySettings\` = ${settingsJson}
        WHERE id = ${tournamentId}
      `;
      
      console.log("Tournament fantasy settings updated successfully:", tournamentId);
    } catch (updateError) {
      console.error("Error updating tournament fantasy settings:", updateError);
      throw updateError;
    }

    // Create contests based on the contests array in settings
    let contestResults = [];
    
    if (settings.enableFantasy && settings.contests && Array.isArray(settings.contests) && settings.contests.length > 0) {
      console.log(`Creating/updating ${settings.contests.length} fantasy contests...`);
      console.log("Contest data sample:", JSON.stringify(settings.contests[0], null, 2));
      
      // Use a transaction to ensure all contest operations are atomic
      try {
        // First get existing contests to avoid duplicates
        const existingContests = await prisma.fantasyContest.findMany({
          where: { tournamentId },
          select: { id: true, name: true }
        });
        
        console.log(`Found ${existingContests.length} existing contests for tournament ${tournamentId}`);
        if (existingContests.length > 0) {
          console.log("Existing contest names:", existingContests.map(c => c.name));
        }
        
        const existingContestNames = existingContests.map(c => c.name.toLowerCase());
        
        // Prepare all contest operations
        const contestOperations = settings.contests.map((contest: any) => {
          // Skip if contest doesn't have a name
          if (!contest.name) {
            console.log("Skipping contest without a name");
            return { skipped: true, reason: "Missing name" };
          }
          
          console.log(`Processing contest: ${contest.name}`);
          
          // Check if contest already exists by name (case insensitive)
          const existingContest = existingContests.find(
            ec => ec.name.toLowerCase() === contest.name.toLowerCase()
          );
          
          // Validate contest data
          if (!contest.prizeBreakdown || !Array.isArray(contest.prizeBreakdown) || contest.prizeBreakdown.length === 0) {
            console.warn(`Contest ${contest.name} has no prize breakdown, adding default`);
            contest.prizeBreakdown = [{ position: 1, percentage: 100 }];
          }
          
          // Validate prize breakdown sums to 100%
          const prizeSum = contest.prizeBreakdown.reduce((sum: number, prize: any) => sum + (prize.percentage || 0), 0);
          if (Math.abs(prizeSum - 100) > 0.1) {
            console.warn(`Contest ${contest.name} prize breakdown sum is ${prizeSum}%, adjusting to 100%`);
            // Adjust the first prize to make sum 100%
            if (contest.prizeBreakdown.length > 0) {
              const adjustment = 100 - (prizeSum - contest.prizeBreakdown[0].percentage);
              contest.prizeBreakdown[0].percentage = adjustment;
            }
          }
          
          // Ensure rules object exists
          if (!contest.rules) {
            console.warn(`Contest ${contest.name} has no rules, adding defaults`);
            contest.rules = {
              captainMultiplier: 2,
              viceCaptainMultiplier: 1.5,
              teamSize: 5,
              maxPlayersPerTeam: 3,
              maxPlayersFromSameTeam: 3,
              substitutionsAllowed: 0
            };
          }
          
          // Prepare contest data
          const contestData = {
            name: contest.name,
            tournamentId,
            entryFee: contest.entryFee || 0,
            prizePool: contest.totalPrize || 0,
            maxEntries: contest.maxEntries || 100,
            currentEntries: 0,
            startDate: new Date(tournament.startDate),
            endDate: new Date(tournament.endDate),
            status: "UPCOMING" as ContestStatus,
            description: contest.description || "",
            rules: JSON.stringify({
              prizeBreakdown: contest.prizeBreakdown || [],
              contestRules: contest.rules || {},
              fantasyPoints: settings.fantasyPoints || "STANDARD",
              autoPublish: settings.autoPublish || true,
            }),
          };
          
          console.log("Contest data prepared:", JSON.stringify(contestData, null, 2));
          
          // Return prepared operation
          if (existingContest) {
            console.log(`Will update existing contest with ID ${existingContest.id}`);
            return {
              type: 'update',
              id: existingContest.id,
              data: contestData
            };
          } else {
            console.log(`Will create new contest: ${contest.name}`);
            return {
              type: 'create',
              data: contestData
            };
          }
        });
        
        // Execute the transaction with all operations
        console.log(`Executing transaction with ${contestOperations.length} operations`);
        contestResults = await prisma.$transaction(async (tx) => {
          const results = [];
          
          for (const operation of contestOperations) {
            try {
              if (operation.type === 'create') {
                const newContest = await tx.fantasyContest.create({
                  data: operation.data
                });
                console.log("Contest created successfully:", newContest.id);
                results.push({ 
                  id: newContest.id, 
                  name: newContest.name, 
                  created: true 
                });
              } else if (operation.type === 'update') {
                const updatedContest = await tx.fantasyContest.update({
                  where: { id: operation.id },
                  data: operation.data
                });
                console.log("Contest updated successfully:", updatedContest.id);
                results.push({ 
                  id: updatedContest.id, 
                  name: updatedContest.name, 
                  updated: true 
                });
              } else {
                results.push(operation); // For skipped operations
              }
            } catch (error) {
              console.error(`Error in transaction for operation:`, operation, error);
              // Don't throw here to avoid breaking the transaction
              // But record the error
              results.push({
                operation,
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
          }
          
          return results;
        });
        
        console.log(`Transaction completed with ${contestResults.length} results`);
        console.log("Contest results:", JSON.stringify(contestResults, null, 2));
        
        // Verify the transaction results
        const verifyContests = await prisma.fantasyContest.findMany({
          where: { tournamentId },
          select: { id: true, name: true }
        });
        console.log(`Verification: Found ${verifyContests.length} contests for tournament ${tournamentId} after transaction`);
      } catch (contestError) {
        console.error("Error in contest transaction:", contestError);
        throw contestError;  // Re-throw to abort the whole operation
      }
    } 
    else {
      console.log("No contests found in the settings or contests array is empty");
      console.log("settings.enableFantasy:", settings.enableFantasy);
      console.log("settings.contests:", settings.contests);
      
      // If fantasy is disabled, delete any existing contests
      if (settings.enableFantasy === false) {
        console.log("Fantasy is disabled, deleting any existing contests");
        try {
          const deleteResult = await prisma.fantasyContest.deleteMany({
            where: { tournamentId }
          });
          console.log(`Deleted ${deleteResult.count} contests`);
        } catch (deleteError) {
          console.error("Error deleting contests:", deleteError);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      tournamentId,
      contestResults
    });
  } catch (error) {
    console.error("Error in fantasy-setup POST:", error);
    return errorHandler(error as Error, request);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from the URL directly to avoid params issue
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idFromPath = pathParts.find((part, index) => 
      pathParts[index-1] === "tournaments" && part !== "fantasy-setup"
    );
    
    if (!idFromPath || isNaN(parseInt(idFromPath))) {
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }
    
    const tournamentId = parseInt(idFromPath);
    console.log(`Fetching fantasy settings for tournament: ${tournamentId}`);

    // Fetch the tournament
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      select: {
        id: true,
        rules: true,
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

    // Parse fantasy settings from rules
    let settings = {};
    try {
      if (tournament.rules) {
        console.log("Raw rules content:", tournament.rules);
        settings = JSON.parse(tournament.rules);
        console.log("Parsed fantasy settings:", settings);
      }
    } catch (e) {
      console.error("Error parsing fantasy settings:", e);
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
