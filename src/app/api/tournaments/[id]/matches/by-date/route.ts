import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/tournaments/[id]/matches/by-date
 * Get tournament matches for a specific date range
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const status = searchParams.get("status");
    
    // Validate tournament ID
    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }
    
    // Validate date parameters
    if (!startDateParam) {
      return NextResponse.json(
        { message: "Start date is required" },
        { status: 400 }
      );
    }
    
    // Parse dates
    const startDate = new Date(startDateParam);
    startDate.setHours(0, 0, 0, 0);
    
    let endDate;
    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // If no end date provided, use the same day as the start date
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Build filter conditions
    const whereConditions: any = {
      tournamentId,
      startTime: {
        gte: startDate,
        lte: endDate
      }
    };
    
    // Add status filter if provided
    if (status) {
      whereConditions.status = status;
    }
    
    // Get matches from database
    const matches = await prisma.match.findMany({
      where: whereConditions,
      include: {
        player1: {
          select: {
            id: true,
            name: true,
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
          }
        },
        team1: {
          select: {
            id: true,
            name: true,
          }
        },
        team2: {
          select: {
            id: true,
            name: true,
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
          }
        },
        referee: {
          include: {
            user: {
              select: {
                username: true,
              }
            }
          }
        },
        winner: true,
      },
      orderBy: [
        { startTime: "asc" },
        { round: "asc" }
      ],
    });
    
    // Group matches by date
    const matchesByDate = matches.reduce((acc, match) => {
      const dateKey = match.startTime.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(match);
      return acc;
    }, {} as Record<string, any[]>);
    
    return NextResponse.json({
      success: true,
      matches,
      matchesByDate,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 