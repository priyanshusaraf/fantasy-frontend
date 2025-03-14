// src/app/api/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skillLevel = searchParams.get("skillLevel");

    // Build query conditions
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ];
    }

    if (skillLevel) {
      where.skillLevel = skillLevel;
    }

    // Get players with pagination
    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.player.count({ where }),
    ]);

    return NextResponse.json({
      players,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        {
          message: "Player name is required",
        },
        { status: 400 }
      );
    }

    // Create new player
    const player = await prisma.player.create({
      data: {
        name: data.name,
        country: data.country || null,
        skillLevel: data.skillLevel || "INTERMEDIATE",
        dominantHand: data.dominantHand || "RIGHT",
        imageUrl: data.imageUrl || null,
        isActive: true,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
