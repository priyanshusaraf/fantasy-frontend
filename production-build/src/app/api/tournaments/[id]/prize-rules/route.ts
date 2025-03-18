import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from 'zod';

/**
 * GET /api/tournaments/[id]/prize-rules
 * Get prize distribution rules for a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    // Fetch tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        prizeDistributionRules: true,
        contestPrizeRules: {
          include: {
            prizeDistributionRules: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Format response
    const response = {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      tournamentRules: tournament.prizeDistributionRules,
      contests: tournament.contestPrizeRules.map(contest => ({
        id: contest.contestId,
        prizeDistributionRules: contest.prizeDistributionRules,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving prize rules:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve prize rules' },
      { status: 500 }
    );
  }
}

// Schema for validating prize rule
const prizeRuleSchema = z.object({
  rank: z.number().min(1),
  percentage: z.number().min(0).max(100),
  minPlayers: z.number().min(0).default(0),
});

// Schema for validating prize distribution rules
const prizeDistributionSchema = z.object({
  tournamentRules: z.array(prizeRuleSchema).optional(),
  contestRules: z.array(
    z.object({
      contestId: z.number(),
      prizeDistributionRules: z.array(prizeRuleSchema),
    })
  ).optional(),
});

/**
 * POST /api/tournaments/[id]/prize-rules
 * Create or update prize distribution rules for a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournamentId = parseInt(params.id);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    // Fetch tournament to check permissions
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organizers: {
          where: { userId: parseInt(session.user.id) },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if user is authorized (tournament organizer or admin)
    const isOrganizer = tournament.organizers.length > 0;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    if (!isOrganizer && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to manage prize rules for this tournament' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = prizeDistributionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid prize distribution data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { tournamentRules, contestRules } = validationResult.data;

    // Validate that percentages sum to 100 for tournament rules
    if (tournamentRules) {
      const totalPercentage = tournamentRules.reduce((sum, rule) => sum + rule.percentage, 0);
      if (totalPercentage !== 100) {
        return NextResponse.json(
          { error: 'Tournament prize percentages must sum to 100%' },
          { status: 400 }
        );
      }
    }

    // Validate that percentages sum to 100 for each contest
    if (contestRules) {
      for (const contest of contestRules) {
        const totalPercentage = contest.prizeDistributionRules.reduce(
          (sum, rule) => sum + rule.percentage, 0
        );
        if (totalPercentage !== 100) {
          return NextResponse.json(
            { error: `Contest ID ${contest.contestId} prize percentages must sum to 100%` },
            { status: 400 }
          );
        }
      }
    }

    // Start a transaction to update rules
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing tournament rules
      await tx.prizeDistributionRule.deleteMany({
        where: { tournamentId },
      });

      // Create new tournament rules if provided
      let newTournamentRules = [];
      if (tournamentRules && tournamentRules.length > 0) {
        newTournamentRules = await Promise.all(
          tournamentRules.map(rule =>
            tx.prizeDistributionRule.create({
              data: {
                tournamentId,
                rank: rule.rank,
                percentage: rule.percentage,
                minPlayers: rule.minPlayers,
              },
            })
          )
        );
      }

      // Update contest-specific rules
      if (contestRules && contestRules.length > 0) {
        for (const contest of contestRules) {
          // Check if contest belongs to the tournament
          const contestExists = await tx.fantasyContest.findFirst({
            where: {
              id: contest.contestId,
              tournamentId,
            },
          });

          if (!contestExists) {
            continue; // Skip this contest if it doesn't belong to the tournament
          }

          // Delete existing contest rules
          await tx.contestPrizeRule.deleteMany({
            where: { contestId: contest.contestId },
          });

          // Create contest prize rule entry
          const contestPrizeRule = await tx.contestPrizeRule.create({
            data: {
              contestId: contest.contestId,
              tournamentId,
            },
          });

          // Create new rules for this contest
          await Promise.all(
            contest.prizeDistributionRules.map(rule =>
              tx.prizeDistributionRule.create({
                data: {
                  contestPrizeRuleId: contestPrizeRule.id,
                  rank: rule.rank,
                  percentage: rule.percentage,
                  minPlayers: rule.minPlayers,
                },
              })
            )
          );
        }
      }

      return {
        tournamentId,
        tournamentRules: newTournamentRules,
        contestRulesUpdated: contestRules?.length || 0,
      };
    });

    return NextResponse.json({
      message: 'Prize rules updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error updating prize rules:', error);
    return NextResponse.json(
      { error: 'Failed to update prize rules' },
      { status: 500 }
    );
  }
} 