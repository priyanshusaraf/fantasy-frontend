import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Never cache this route
export const revalidate = 0; // Revalidate on every request

export async function GET() {
  try {
    const requestTime = new Date().toISOString();
    console.log('[DEBUG-API] Live matches requested at', requestTime);

    // Fetch actual live matches from database
    const matches = await prisma.match.findMany({
      where: {
        status: "IN_PROGRESS",
      },
      include: {
        player1: true,
        player2: true,
        tournament: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 5, // Limit to 5 most recent matches
    });

    console.log('[DEBUG-API] Found', matches.length, 'live matches');
    if (matches.length > 0) {
      // Log the scores for debugging
      matches.forEach(match => {
        console.log(`[DEBUG-API] Match ${match.id}: ${match.player1?.name || 'Player 1'} (${match.player1Score}) vs ${match.player2?.name || 'Player 2'} (${match.player2Score})`);
      });
    }

    // Transform data to expected format
    const formattedMatches = matches.map(match => ({
      id: match.id,
      teamA: {
        name: match.player1?.name || "Player 1",
        score: match.player1Score || 0,
      },
      teamB: {
        name: match.player2?.name || "Player 2",
        score: match.player2Score || 0,
      },
      status: "live",
      tournamentName: match.tournament?.name || "Tournament",
      round: match.round || "Unknown Round",
    }));

    // Add cache control headers to prevent caching
    const responseTime = new Date().toISOString();
    console.log('[DEBUG-API] Sending response at', responseTime);
    
    return new NextResponse(
      JSON.stringify({ 
        matches: formattedMatches,
        requestTime,
        responseTime,
        serverTime: Date.now()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'X-Request-Time': requestTime,
          'X-Response-Time': responseTime
        }
      }
    );
  } catch (error) {
    console.error("[DEBUG-API] Error fetching live matches:", error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to fetch live matches", 
        matches: [],
        errorTime: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  }
} 