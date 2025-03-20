// src/app/api/tournaments/[id]/fantasy-setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

// Add this helper function to calculate player prices
const getPlayerPrice = (skillLevel: string): number => {
  switch (skillLevel) {
    case 'A+':
      return 12000;
    case 'A':
      return 11500;
    case 'A-':
      return 11000;
    case 'B+':
      return 10500;
    case 'B':
      return 10000;
    case 'B-':
      return 9500;
    case 'C':
      return 9000;
    case 'D':
      return 9000;
    default:
      return 9000;
  }
};

// Fix for the contest creation data - removing currentEntries field
interface ContestSettings {
  name: string;
  entryFee?: number;
  totalPrize?: number;
  maxEntries?: number;
  description?: string;
  prizeBreakdown?: Array<any>;
  rules?: Record<string, any>;
}

interface TournamentData {
  id: number;
  startDate: Date | string;
  endDate: Date | string;
}

interface FantasySettings {
  fantasyPoints?: string;
  autoPublish?: boolean;
}

const prepareContestData = (
  contest: ContestSettings, 
  tournament: TournamentData, 
  settings: FantasySettings
) => {
  // Create contest data without invalid currentEntries field
  return {
    name: contest.name,
    tournamentId: tournament.id,
    entryFee: contest.entryFee || 0,
    prizePool: contest.totalPrize || 0,
    maxEntries: contest.maxEntries || 100,
    startDate: new Date(tournament.startDate),
    endDate: new Date(tournament.endDate),
    status: "OPEN",
    description: contest.description || ""
    // Rules field is not in the database schema
    // We'll need to create a ContestPrizeRule object instead
  };
};

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

    // Check for permissions
    const allowedRoles = ["MASTER_ADMIN", "TOURNAMENT_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      console.error("User role not authorized:", user.role);
      return NextResponse.json(
        {
          message: "Not authorized to configure fantasy settings",
        },
        { status: 403 }
      );
    }

    // Parse request body and log for debugging
    const settings = await request.json();
    console.log("Fantasy settings received:", JSON.stringify(settings, null, 2));

    // Get the tournament
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    });

    if (!tournament) {
      console.error(`Tournament with ID ${tournamentId} not found`);
      return NextResponse.json(
        { message: `Tournament with ID ${tournamentId} not found` },
        { status: 404 }
      );
    }

    // Check if the tournament end date has passed
    if (tournament.endDate < new Date()) {
      console.error(`Tournament with ID ${tournamentId} has already ended and cannot be updated`);
      return NextResponse.json(
        { message: "Cannot update fantasy settings for a completed tournament" },
        { status: 400 }
      );
    }

    // Initialize variables for response
    let fantasyEnabled = false;
    let contestResults: any[] = [];
    
    // Update tournament's fantasy enabled flag
    try {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          fantasySettings: JSON.stringify({
            enableFantasy: settings.enableFantasy || false,
            fantasyPoints: settings.fantasyPoints || "STANDARD",
            autoPublish: settings.autoPublish || true,
            customPoints: settings.customPoints || null,
          }),
        },
      });
      
      fantasyEnabled = settings.enableFantasy || false;
      console.log(`Tournament fantasy enabled: ${fantasyEnabled}`);
    } catch (updateError) {
      console.error("Error updating tournament fantasy settings:", updateError);
      return NextResponse.json(
        { message: "Failed to update tournament fantasy settings" },
        { status: 500 }
      );
    }
    
    // Process contests if they exist
    if (settings.enableFantasy && Array.isArray(settings.contests) && settings.contests.length > 0) {
      console.log(`Processing ${settings.contests.length} contests`);
      
      try {
        // Get existing contests for this tournament for update/create decisions
        const existingContests = await prisma.fantasyContest.findMany({
          where: { tournamentId },
        });
        console.log(`Found ${existingContests.length} existing contests`);
        
        // Validate contests before processing
        const validationErrors: string[] = [];
        settings.contests.forEach((contest: any, index: number) => {
          if (!contest.name || contest.name.trim() === "") {
            validationErrors.push(`Contest at index ${index} is missing a name`);
          }
          
          // Validate prize breakdown
          if (!contest.prizeBreakdown || !Array.isArray(contest.prizeBreakdown) || contest.prizeBreakdown.length === 0) {
            validationErrors.push(`Contest "${contest.name || `#${index}`}" is missing a valid prize breakdown`);
          } else {
            const prizeSum = contest.prizeBreakdown.reduce((sum: number, prize: any) => sum + (prize.percentage || 0), 0);
            if (Math.abs(prizeSum - 100) > 1) { // Allow for small rounding errors up to 1%
              validationErrors.push(`Contest "${contest.name || `#${index}`}" prize breakdown sum is ${prizeSum.toFixed(2)}%, must be 100%`);
            }
          }
          
          // Validate numeric values
          if (contest.entryFee !== undefined && (isNaN(contest.entryFee) || contest.entryFee < 0)) {
            validationErrors.push(`Contest "${contest.name || `#${index}`}" has an invalid entry fee`);
          }
          
          if (contest.maxEntries !== undefined && (isNaN(contest.maxEntries) || contest.maxEntries < 1)) {
            validationErrors.push(`Contest "${contest.name || `#${index}`}" has an invalid max entries value`);
          }
        });
        
        // If there are validation errors, return them all at once
        if (validationErrors.length > 0) {
          console.error("Contest validation errors:", validationErrors);
          return NextResponse.json(
            { 
              message: "Contest validation failed", 
              errors: validationErrors 
            },
            { status: 400 }
          );
        }
        
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
          const contestData = prepareContestData(contest, tournament, settings);
          
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
                // Remove the currentEntries field which isn't in the schema
                const { currentEntries, ...cleanData } = operation.data;
                
                // Extract the original contest from settings to access rules data
                const originalContest = settings.contests.find(
                  (c: any) => c.name === operation.data.name
                );
                
                // Create the fantasy contest
                const newContest = await tx.fantasyContest.create({
                  data: cleanData
                });
                console.log("Contest created successfully:", newContest.id);
                
                // Now create the ContestPrizeRule with the rules
                if (originalContest) {
                  try {
                    const prizeRule = await tx.contestPrizeRule.create({
                      data: {
                        tournamentId: tournamentId,
                        contestId: newContest.id,
                      }
                    });
                    console.log("Prize rule created for contest:", prizeRule.id);
                    
                    // Create prize distribution rules if prizeBreakdown is provided
                    if (originalContest.prizeBreakdown && originalContest.prizeBreakdown.length > 0) {
                      for (const prize of originalContest.prizeBreakdown) {
                        await tx.prizeDistributionRule.create({
                          data: {
                            tournamentId: tournamentId,
                            contestPrizeRuleId: prizeRule.id,
                            position: prize.position,
                            percentage: prize.percentage,
                            minPosition: prize.position,
                            maxPosition: prize.position
                          }
                        });
                      }
                      console.log(`Created ${originalContest.prizeBreakdown.length} prize distribution rules`);
                    }
                  } catch (ruleError) {
                    console.error("Error creating prize rules:", ruleError);
                  }
                }
                
                results.push({ 
                  id: newContest.id, 
                  name: newContest.name, 
                  created: true 
                });
              } else if (operation.type === 'update') {
                // Remove the currentEntries field which isn't in the schema
                const { currentEntries, ...cleanData } = operation.data;
                const updatedContest = await tx.fantasyContest.update({
                  where: { id: operation.id },
                  data: cleanData
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
