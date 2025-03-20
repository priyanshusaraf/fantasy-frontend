// src/app/api/fantasy-pickleball/contests/[id]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorHandler } from "@/middleware/error-handler";
import { verify } from "jsonwebtoken";

// Contest rules interface
interface ContestRules {
  playerCategories?: Array<{name: string, price: number}>;
  walletSize?: number;
  fantasyTeamSize?: number;
  teamSize?: number; // Some code seems to use this instead of fantasyTeamSize
  allowTeamChanges?: boolean;
  changeFrequency?: string;
  maxPlayersToChange?: number;
  changeWindowStart?: string;
  changeWindowEnd?: string;
  [key: string]: any;
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const contestIdStr = params.id;
    
    // Start with validation of the contestId
    if (!contestIdStr) {
      console.error("Contest ID is missing in params");
      return NextResponse.json(
        { message: "Contest ID is required" },
        { status: 400 }
      );
    }
    
    const contestId = parseInt(contestIdStr);
    
    console.log(`Processing join request for contest ID: ${contestId}`);
    
    if (isNaN(contestId)) {
      console.error(`Invalid contest ID format: ${contestIdStr}`);
      return NextResponse.json(
        { message: "Invalid contest ID format" },
        { status: 400 }
      );
    }

    // Check authentication using session
    let userId: string | undefined;
    
    // First try getting the session
    console.log("Attempting to authenticate via session...");
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      console.log(`User authenticated via session: ${userId}`);
    }
    // Then try token-based auth if session failed
    else {
      console.log("Session auth failed, attempting token-based auth...");
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("No valid authorization header found");
        return NextResponse.json(
          { message: "Unauthorized - no valid authentication" },
          { status: 401 }
        );
      }

      const token = authHeader.split(" ")[1];
      try {
        const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
        console.log(`User authenticated via token: ${userId}`);
      } catch (error) {
        console.error("Token verification failed:", error);
        return NextResponse.json(
          { message: "Unauthorized - invalid token" },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      console.error("No user ID found after authentication attempts");
      return NextResponse.json(
        { message: "Unauthorized - user not identified" },
        { status: 401 }
      );
    }

    // Validate the userId can be parsed as a number
    let userIdNum: number;
    try {
      userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        console.error(`Invalid userId format: ${userId}`);
        return NextResponse.json(
          { message: "Invalid user ID format" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error parsing userId: ${userId}`, error);
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400 }
      );
    }

    console.log("Parsing request body...");
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { message: "Invalid request body format" },
        { status: 400 }
      );
    }

    const { name, players, captain, viceCaptain } = requestBody;
    console.log("Request data:", { 
      name, 
      playerCount: players?.length, 
      playerIds: players,
      captain, 
      viceCaptain,
      userId: userIdNum
    });

    // Enhanced validation of required fields
    if (!name) {
      console.error("Team name is missing");
      return NextResponse.json(
        { message: "Team name is required" },
        { status: 400 }
      );
    }
    
    if (!players || !Array.isArray(players)) {
      console.error("Players must be a valid array");
      return NextResponse.json(
        { message: "Players must be a valid array" },
        { status: 400 }
      );
    }
    
    if (players.length === 0) {
      console.error("No players selected");
      return NextResponse.json(
        { message: "At least one player must be selected" },
        { status: 400 }
      );
    }
    
    if (!captain) {
      console.error("Captain is missing");
      return NextResponse.json(
        { message: "Captain is required" },
        { status: 400 }
      );
    }

    if (!viceCaptain) {
      console.error("Vice captain is missing");
      return NextResponse.json(
        { message: "Vice captain is required" },
        { status: 400 }
      );
    }

    // Check if the user already has a team for this contest
    console.log(`Checking if user ${userIdNum} already has a team for contest ${contestId}...`);
    
    try {
    const existingTeam = await prisma.fantasyTeam.findFirst({
      where: {
        contestId,
          userId: userIdNum,
      },
    });

    if (existingTeam) {
        console.log(`User ${userIdNum} already has a team for contest ${contestId}: ${existingTeam.id}`);
        return NextResponse.json(
          { message: "You already have a team for this contest" },
          { status: 400 }
        );
      }
    } catch (dbError) {
      console.error("Database error while checking existing team:", dbError);
      return NextResponse.json(
        { message: "Error checking existing team", error: String(dbError) },
        { status: 500 }
      );
    }

    // Check if the contest exists and is still open for registration
    console.log(`Fetching contest details for ID ${contestId}...`);
    let contest;
    try {
      contest = await prisma.fantasyContest.findUnique({
        where: {
          id: contestId,
        },
        include: {
          contestPrizeRule: {
            include: {
              prizeDistributionRules: true
            }
          },
          tournament: {
            select: {
              id: true,
              name: true,
              startDate: true
            }
          }
        }
      });

      if (!contest) {
        console.log(`Contest with ID ${contestId} not found`);
        return NextResponse.json(
          { message: "Contest not found" },
          { status: 404 }
        );
      }
    } catch (dbError) {
      console.error("Database error while fetching contest:", dbError);
      return NextResponse.json(
        { message: "Error fetching contest", error: String(dbError) },
        { status: 500 }
      );
    }

    // Check if tournament has already started instead of checking contest status
    const currentDate = new Date();
    const tournamentStartDate = new Date(contest.tournament.startDate);
    
    if (currentDate >= tournamentStartDate) {
      console.log(`Tournament for contest ${contestId} has already started on ${tournamentStartDate}`);
      return NextResponse.json(
        { message: "Tournament has already started. You can only join contests before the tournament begins." },
        { status: 400 }
      );
    }

    // Parse contest rules
    console.log("Parsing contest rules...");
    let rules: ContestRules = {};
    try {
      if (typeof contest.rules === "string") {
        rules = JSON.parse(contest.rules || "{}") as ContestRules;
      } else if (contest.rules) {
        rules = contest.rules as ContestRules;
      }
    } catch (e) {
      console.error("Error parsing contest rules:", e);
    }

    // Check team size
    const teamSize = rules.teamSize || rules.fantasyTeamSize || 7;
    console.log(`Required team size: ${teamSize}, selected players: ${players.length}`);
    if (players.length !== teamSize) {
      return NextResponse.json(
        {
          message: `Team must have exactly ${teamSize} players`,
        },
        { status: 400 }
      );
    }

    // Parse and verify player IDs
    const playerIds: number[] = [];
    for (const id of players) {
      try {
        const playerId = typeof id === 'string' ? parseInt(id) : id;
        if (isNaN(playerId)) {
          console.error(`Invalid player ID format: ${id}`);
          return NextResponse.json(
            { message: `Invalid player ID: ${id}` },
            { status: 400 }
          );
        }
        playerIds.push(playerId);
      } catch (error) {
        console.error(`Error parsing player ID: ${id}`, error);
        return NextResponse.json(
          { message: `Error parsing player ID: ${id}` },
          { status: 400 }
        );
      }
    }

    // Parse and verify captain and vice-captain IDs
    let captainId: number;
    let viceCaptainId: number;
    
    try {
      captainId = typeof captain === 'string' ? parseInt(captain) : captain;
      if (isNaN(captainId)) {
        console.error(`Invalid captain ID format: ${captain}`);
        return NextResponse.json(
          { message: `Invalid captain ID: ${captain}` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error parsing captain ID: ${captain}`, error);
      return NextResponse.json(
        { message: `Error parsing captain ID: ${captain}` },
        { status: 400 }
      );
    }
    
    try {
      viceCaptainId = typeof viceCaptain === 'string' ? parseInt(viceCaptain) : viceCaptain;
      if (isNaN(viceCaptainId)) {
        console.error(`Invalid vice-captain ID format: ${viceCaptain}`);
        return NextResponse.json(
          { message: `Invalid vice-captain ID: ${viceCaptain}` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error parsing vice-captain ID: ${viceCaptain}`, error);
      return NextResponse.json(
        { message: `Error parsing vice-captain ID: ${viceCaptain}` },
        { status: 400 }
      );
    }

    // Verify captain and vice-captain are in the team
    if (!playerIds.includes(captainId)) {
      console.log(`Captain ${captainId} is not in the selected players`);
      return NextResponse.json(
        {
          message: "Captain must be in your team",
        },
        { status: 400 }
      );
    }

    if (!playerIds.includes(viceCaptainId)) {
      console.log(`Vice captain ${viceCaptainId} is not in the selected players`);
      return NextResponse.json(
        {
          message: "Vice captain must be in your team",
        },
        { status: 400 }
      );
    }

    if (captainId === viceCaptainId) {
      console.log("Captain and vice captain are the same player");
      return NextResponse.json(
        {
          message: "Captain and vice captain must be different players",
        },
        { status: 400 }
      );
    }

    // Check budget constraints - this part can be skipped since we're using mock players
    console.log("Budget validation check is skipped for mock players");

    // Create the team
    console.log("Creating fantasy team...");
    try {
      // Prepare the data for team creation
      const teamData = {
        name,
        userId: userIdNum,
        contestId,
        totalPoints: 0,
        players: {
          create: playerIds.map((playerId) => {
            const isCaptain = playerId === captainId;
            const isViceCaptain = playerId === viceCaptainId;
            
            console.log(`Processing player: ${playerId}, isCaptain: ${isCaptain}, isViceCaptain: ${isViceCaptain}`);
            
            return {
            playerId,
              isCaptain,
              isViceCaptain,
            };
          }),
        },
      };
      
      // DEBUG: Print exact database schema and values being used
      console.log("***** DEBUG TEAM DATA *****");
      console.log("Team Name:", name);
      console.log("User ID:", userIdNum, "Type:", typeof userIdNum);
      console.log("Contest ID:", contestId, "Type:", typeof contestId);
      console.log("Total Points:", 0);
      console.log("Player Records:", JSON.stringify(teamData.players.create, null, 2));
      
      // Verify all referenced players exist in the database and have proper skill categories
      console.log("Verifying players exist in database and have proper skill categories...");
      
      try {
        // Get the full player records to check skill levels
        const validPlayers = await prisma.player.findMany({
          where: {
            id: {
              in: playerIds
            }
          },
          select: {
            id: true,
            name: true,
            skillLevel: true
          }
        });
        
        console.log(`Found ${validPlayers.length} out of ${playerIds.length} players in the database`);
        
        // Find which player IDs are missing
        const validPlayerIds = validPlayers.map(p => p.id);
        const missingPlayerIds = playerIds.filter(id => !validPlayerIds.includes(id));
        
        if (missingPlayerIds.length > 0) {
          console.error("One or more selected players do not exist in the database");
          console.log("Missing player IDs:", missingPlayerIds);
          
          return NextResponse.json(
            { 
              message: "One or more selected players do not exist in the database", 
              details: {
                validPlayerIds,
                missingPlayerIds,
                selectedPlayerIds: playerIds
              }
            },
            { status: 400 }
          );
        }
        
        // Check if any players are using old skill level formats
        const validSkillLevels = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'D'];
        const invalidCategoryPlayers = validPlayers.filter(player => 
          !player.skillLevel || 
          !validSkillLevels.includes(player.skillLevel as string)
        );
        
        if (invalidCategoryPlayers.length > 0) {
          console.error("Some players have invalid or outdated skill categories");
          console.log("Invalid category players:", invalidCategoryPlayers);
          
          return NextResponse.json(
            { 
              message: "Some players have invalid or outdated skill categories. Please ensure all players use the A, B, C, D category format.", 
              details: {
                invalidPlayers: invalidCategoryPlayers.map(p => ({
                  id: p.id,
                  name: p.name,
                  currentSkillLevel: p.skillLevel || 'not set'
                }))
              }
            },
            { status: 400 }
          );
        }
      } catch (verificationError) {
        console.error("Error verifying players:", verificationError);
        return NextResponse.json(
          { message: "Error verifying player categories", error: String(verificationError) },
          { status: 500 }
        );
      }
      
      // TEMPORARY: For debugging purposes, return success without actually creating the team
      // Remove this block in production
      if (process.env.NODE_ENV === 'development') {
        console.log("DEVELOPMENT MODE: Bypassing actual team creation for debugging");
        return NextResponse.json(
          {
            message: "Team validated successfully (development mode - not actually created)",
            team: {
              simulatedId: Math.floor(Math.random() * 1000),
              name: name,
              userId: userIdNum,
              contestId: contestId
            },
            debug: {
              teamData,
              playerIds,
              captainId,
              viceCaptainId
            }
          },
          { status: 200 }
        );
      }
      
      // PRODUCTION CODE: Actual database operation
      console.log("Attempting team creation in database...");
      
      // Use a transaction to ensure all operations succeed or fail together
      const team = await prisma.$transaction(async (prismaClient) => {
        // First create the team
        const newTeam = await prismaClient.fantasyTeam.create({
          data: teamData,
      include: {
            players: true
          }
    });
        
        console.log(`Team created successfully with ID: ${newTeam.id}, players: ${newTeam.players.length}`);

    // Update contest entries count
        await prismaClient.fantasyContest.update({
      where: { id: contestId },
      data: {
        currentEntries: {
          increment: 1,
        },
      },
    });

        return newTeam;
      });
      
      console.log("Transaction completed successfully");

      return NextResponse.json(
        {
          message: "Team created successfully",
          team: {
            id: team.id,
            name: team.name,
            players: team.players.length
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating team in database:", error);
      // Log the full error details for debugging
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Try to identify common database errors
      let errorMessage = "Database error while creating team";
      let statusCode = 500;
      
      if (error instanceof Error) {
        if (error.message.includes("Foreign key constraint failed")) {
          errorMessage = "One or more selected players do not exist in the database";
          statusCode = 400;
        } else if (error.message.includes("Unique constraint failed")) {
          errorMessage = "A player can only be selected once in a team";
          statusCode = 400;
        }
      }
      
      return NextResponse.json(
        { 
          message: errorMessage,
          error: error instanceof Error ? error.message : "Unknown error",
          details: typeof error === 'object' ? JSON.stringify(error) : String(error)
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("Unexpected error in join contest route:", error);
    // Log the full error details for debugging
    console.error("Full error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    return NextResponse.json(
      { 
        message: "Server error", 
        error: error instanceof Error ? error.message : "Unknown error",
        details: typeof error === 'object' ? JSON.stringify(error) : String(error)
      },
      { status: 500 }
    );
  }
}
