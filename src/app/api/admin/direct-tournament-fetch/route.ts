import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Direct tournament fetch endpoint that bypasses API authentication
export async function GET(request: NextRequest) {
  try {
    // Get tournament ID from URL query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    console.log(`Direct tournament fetch request for ID: ${id}`);
    
    if (!id) {
      console.log("No tournament ID provided");
      return NextResponse.json(
        { message: "Tournament ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch tournament directly from the database
    const tournamentId = parseInt(id);
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });
    
    if (!tournament) {
      console.log(`Tournament with ID ${id} not found`);
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }
    
    // Also fetch the tournament admin info separately
    let organizer = null;
    try {
      const admin = await prisma.tournamentAdmin.findUnique({
        where: { id: tournament.organizerId }
      });
      
      if (admin) {
        const user = await prisma.user.findUnique({
          where: { id: admin.userId },
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        });
        
        organizer = {
          id: admin.id,
          user: user
        };
      }
    } catch (adminError) {
      console.error("Error fetching tournament admin:", adminError);
      // Continue without admin info
    }
    
    // Count tournament players
    let playerCount = 0;
    try {
      playerCount = await prisma.tournamentEntry.count({
        where: { tournamentId }
      });
    } catch (playerError) {
      console.error("Error counting players:", playerError);
    }
    
    // Count tournament referees - using a more general approach since tournamentReferee might not exist
    let refereeCount = 0;
    try {
      // Check if the referee join request table exists instead
      refereeCount = await prisma.refereeJoinRequest.count({
        where: { 
          tournamentId,
          status: "APPROVED" 
        }
      });
    } catch (refereeError) {
      console.error("Error counting referees:", refereeError);
      // If that fails too, set to 0
      refereeCount = 0;
    }
    
    // Get fantasy data if it exists
    let fantasyData = null;
    try {
      // First check if tournament has the dedicated fantasySettings field
      if ('fantasySettings' in tournament && tournament.fantasySettings) {
        try {
          // Parse the stored settings
          const parsedSettings = JSON.parse(tournament.fantasySettings as string);
          
          fantasyData = {
            enableFantasy: parsedSettings.enableFantasy || false,
            fantasyPoints: parsedSettings.fantasyPoints || "STANDARD",
            autoPublish: parsedSettings.autoPublish || true,
            customPoints: parsedSettings.customPoints || null,
            ...parsedSettings,
          };
          console.log("Found fantasy settings:", fantasyData);
        } catch (parseError) {
          console.error("Error parsing fantasy settings:", parseError);
        }
      }
      // Then check if tournament has rules with fantasy settings (for backward compatibility)
      else if ('rules' in tournament && tournament.rules) {
        try {
          // Parse the stored settings
          const parsedRules = JSON.parse(tournament.rules as string);
          
          // Check if rules contain fantasy settings
          if (parsedRules.enableFantasy !== undefined || 
              parsedRules.contests !== undefined || 
              parsedRules.fantasyPoints !== undefined) {
            fantasyData = {
              enableFantasy: parsedRules.enableFantasy || false,
              fantasyPoints: parsedRules.fantasyPoints || "STANDARD",
              autoPublish: parsedRules.autoPublish || true,
              contests: parsedRules.contests || [],
              ...parsedRules,
            };
            console.log("Found fantasy settings in rules (legacy):", fantasyData);
          }
        } catch (parseError) {
          console.error("Error parsing rules for fantasy settings:", parseError);
        }
      }
      
      // Now check for contests as well - fetch with more details
      console.log(`Fetching fantasy contests for tournament ${tournamentId}`);
      const fantasyContests = await prisma.fantasyContest.findMany({
        where: { tournamentId },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`Found ${fantasyContests.length} fantasy contests in the database`);
      
      if (fantasyContests.length > 0) {
        console.log(`First contest in DB: ${JSON.stringify(fantasyContests[0].name)}`);
        
        fantasyData = fantasyData || {};
        fantasyData.enableFantasy = true;
        
        // Process contests to match the expected format
        const processedContests = fantasyContests.map(contest => {
          const contestData = {
            id: contest.id.toString(),
            name: contest.name,
            entryFee: parseFloat(contest.entryFee.toString()),
            maxEntries: contest.maxEntries,
            totalPrize: parseFloat(contest.prizePool.toString()),
            currentEntries: contest.currentEntries,
            status: contest.status,
            prizeBreakdown: [],
            rules: {},
            description: contest.description,
            startDate: contest.startDate,
            endDate: contest.endDate
          };
          
          // Try to parse the rules field
          if (contest.rules) {
            try {
              const parsedRules = JSON.parse(contest.rules as string);
              if (parsedRules.prizeBreakdown) {
                contestData.prizeBreakdown = parsedRules.prizeBreakdown;
              }
              if (parsedRules.contestRules) {
                contestData.rules = parsedRules.contestRules;
              }
            } catch (e) {
              console.error("Error parsing contest rules:", e);
            }
          }
          
          return contestData;
        });
        
        fantasyData.contests = processedContests;
        fantasyData.contestCount = fantasyContests.length;
        console.log(`Processed ${processedContests.length} contests for response`);
      } else {
        // Just a fallback in case no contests were found
        console.log("No contests found, checking if fantasy is enabled in settings");
        
        if (fantasyData && fantasyData.enableFantasy) {
          console.log("Fantasy is enabled in settings but no contests found");
          fantasyData.contests = [];
          fantasyData.contestCount = 0;
        }
        
        // Try a simpler query as a sanity check
        try {
          const contestCount = await prisma.fantasyContest.count();
          console.log(`Total contests in database: ${contestCount}`);
        } catch (err) {
          console.error("Error counting all contests:", err);
        }
      }
    } catch (fantasyError) {
      console.error("Error fetching fantasy data:", fantasyError);
    }
    
    console.log(`Tournament fetched successfully: ${tournament.id}`);
    
    // Return the tournament data with the organizer info and counts
    return NextResponse.json({
      ...tournament,
      organizer,
      playerCount,
      refereeCount,
      fantasy: fantasyData
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { message: "Failed to fetch tournament", error: String(error) },
      { status: 500 }
    );
  }
} 