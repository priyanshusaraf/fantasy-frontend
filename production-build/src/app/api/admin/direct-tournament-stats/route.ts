import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Direct tournament stats endpoint that bypasses API authentication
export async function GET(request: NextRequest) {
  try {
    // Get tournament ID from URL query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    console.log(`Direct tournament stats request for ID: ${id}`);
    
    if (!id) {
      console.log("No tournament ID provided");
      return NextResponse.json(
        { message: "Tournament ID is required" },
        { status: 400 }
      );
    }
    
    const tournamentId = parseInt(id);
    
    // First, verify the tournament exists
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
    
    // Count matches in this tournament
    const matchCount = await prisma.match.count({
      where: { tournamentId }
    });
    
    // Count completed matches
    const completedMatchCount = await prisma.match.count({
      where: { 
        tournamentId,
        status: "COMPLETED" 
      }
    });
    
    // Count upcoming matches
    const upcomingMatchCount = await prisma.match.count({
      where: { 
        tournamentId,
        status: "SCHEDULED" 
      }
    });
    
    // Count players in this tournament (using TournamentEntry model)
    const playerCount = await prisma.tournamentEntry.count({
      where: { tournamentId }
    });
    
    // Return the stats
    const stats = {
      totalMatches: matchCount,
      completedMatches: completedMatchCount,
      upcomingMatches: upcomingMatchCount,
      playerCount: playerCount,
      fantasy: {
        contestCount: 0,
        participantCount: 0,
        totalPrizePool: 0
      }
    };
    
    console.log(`Stats fetched for tournament ${id}:`, stats);
    
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournament stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch tournament stats", error: String(error) },
      { status: 500 }
    );
  }
} 