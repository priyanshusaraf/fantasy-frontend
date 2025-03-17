import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRazorpayPayout } from "@/lib/razorpay-payout";
import { Decimal } from "decimal.js";
import { RazorpayService } from '@/lib/services/razorpay';
import { notifyWinner } from '@/lib/services/notifications';

/**
 * POST /api/tournaments/[id]/distribute-prizes
 * Distribute prizes for a completed tournament based on configured rules
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournamentId = parseInt(params.id);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    // Fetch tournament to verify it exists and is completed
    const tournament = await prisma.tournament.findUnique({
      where: { 
        id: tournamentId,
        status: 'COMPLETED' // Only completed tournaments can have prizes distributed
      },
      include: {
        organizers: {
          where: { userId: parseInt(session.user.id) }
        },
        fantasyContests: {
          where: { isPrizesDistributed: false }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found or not yet completed' },
        { status: 404 }
      );
    }

    // Verify user is authorized (organizer or admin)
    const isOrganizer = tournament.organizers.length > 0;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    if (!isOrganizer && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to distribute prizes for this tournament' },
        { status: 403 }
      );
    }

    // Parse request body for contest ID and optional parameters
    const { contestId, skipPaymentProcessing = false } = await req.json();
    
    if (!contestId) {
      return NextResponse.json(
        { error: 'Contest ID is required' },
        { status: 400 }
      );
    }

    // Find the contest
    const contest = await prisma.fantasyContest.findFirst({
      where: {
        id: parseInt(contestId),
        tournamentId,
        isPrizesDistributed: false
      },
      include: {
        contestPrizeRule: {
          include: {
            prizeDistributionRules: true
          }
        },
        fantasyTeams: {
          orderBy: {
            totalPoints: 'desc'
          },
          include: {
            user: true
          }
        }
      }
    });

    if (!contest) {
      return NextResponse.json(
        { error: 'Contest not found or prizes already distributed' },
        { status: 404 }
      );
    }

    if (contest.fantasyTeams.length === 0) {
      return NextResponse.json(
        { error: 'No teams participated in this contest' },
        { status: 400 }
      );
    }

    // Get applicable prize rules (contest specific or tournament default)
    let prizeRules = contest.contestPrizeRule?.prizeDistributionRules || [];
    
    // If no contest-specific rules, check for tournament-level rules
    if (prizeRules.length === 0) {
      const tournamentRules = await prisma.prizeDistributionRule.findMany({
        where: {
          tournamentId,
          contestPrizeRuleId: null
        },
        orderBy: {
          rank: 'asc'
        }
      });
      
      prizeRules = tournamentRules;
    }

    if (prizeRules.length === 0) {
      return NextResponse.json(
        { error: 'No prize distribution rules defined for this contest' },
        { status: 400 }
      );
    }

    // Filter rules based on minimum players requirement
    const applicableRules = prizeRules.filter(rule => 
      rule.minPlayers <= contest.fantasyTeams.length
    );

    if (applicableRules.length === 0) {
      return NextResponse.json(
        { error: 'Not enough participants to meet prize distribution criteria' },
        { status: 400 }
      );
    }

    // Mark contest as processing prizes
    await prisma.fantasyContest.update({
      where: { id: contest.id },
      data: { isPrizesProcessing: true }
    });

    // Calculate prize amounts based on rules
    const prizePool = parseFloat(contest.prizePool.toString());
    const RAZORPAY_FEE_PERCENTAGE = 2.36; // Can be moved to env var or config
    
    const prizeDisbursements = [];
    
    // Create prize disbursements up to the number of applicable rules
    // (ensuring we don't try to award more positions than we have participants)
    const maxPositions = Math.min(applicableRules.length, contest.fantasyTeams.length);
    
    for (let i = 0; i < maxPositions; i++) {
      const rule = applicableRules[i];
      const team = contest.fantasyTeams[i];
      
      if (!team || !rule) continue;
      
      const percentage = parseFloat(rule.percentage.toString());
      const prizeAmount = (prizePool * percentage) / 100;
      const processingFee = (prizeAmount * RAZORPAY_FEE_PERCENTAGE) / 100;
      const netAmount = prizeAmount - processingFee;
      
      // Create prize disbursement record
      const disbursement = await prisma.prizeDisbursement.create({
        data: {
          contestId: contest.id,
          fantasyTeamId: team.id,
          userId: team.userId,
          amount: prizeAmount,
          netAmount,
          rank: i + 1, // 1-indexed rank
          processingFee,
          status: 'PENDING',
          notes: `Prize for ${getOrdinal(i + 1)} place in ${contest.name}`
        }
      });
      
      prizeDisbursements.push(disbursement);
      
      // Notify the winner (implementation depends on notification system)
      await notifyWinner({
        userId: team.userId,
        userName: team.user.name || team.user.username || `User ${team.userId}`,
        contestName: contest.name,
        teamName: team.name,
        rank: i + 1,
        prizeAmount,
        netAmount,
        tournamentName: tournament.name
      });
    }

    // Process payments if not skipped
    if (!skipPaymentProcessing) {
      try {
        // Initialize Razorpay service
        const razorpay = new RazorpayService();
        
        // Process each payout
        for (const disbursement of prizeDisbursements) {
          // Fetch user's bank account info
          const bankAccount = await prisma.bankAccount.findFirst({
            where: { userId: disbursement.userId, isPrimary: true }
          });
          
          if (!bankAccount) {
            console.warn(`No bank account found for user ${disbursement.userId}`);
            continue;
          }
          
          try {
            // Initiate payout via Razorpay
            const payout = await razorpay.createPayout({
              accountNumber: bankAccount.accountNumber,
              ifscCode: bankAccount.ifscCode,
              amount: Math.floor(disbursement.netAmount * 100), // Convert to paise
              name: bankAccount.accountHolderName,
              notes: {
                contestId: contest.id.toString(),
                tournamentId: tournamentId.toString(),
                disbursementId: disbursement.id.toString()
              }
            });
            
            // Update disbursement with payout information
            await prisma.prizeDisbursement.update({
              where: { id: disbursement.id },
              data: {
                transactionId: payout.id,
                status: 'PROCESSING',
                paymentDetails: payout
              }
            });
          } catch (error) {
            console.error(`Error processing payout for user ${disbursement.userId}:`, error);
            
            // Update disbursement with error status
            await prisma.prizeDisbursement.update({
              where: { id: disbursement.id },
              data: {
                status: 'FAILED',
                notes: `Failed to process payout: ${error.message || 'Unknown error'}`
              }
            });
          }
        }
      } catch (error) {
        console.error('Error initializing payment processing:', error);
        
        // Continue execution but note the error
        return NextResponse.json({
          success: true,
          warning: 'Prize disbursements created but payment processing failed',
          error: error.message,
          tournamentId,
          contestId,
          prizeDisbursements
        });
      }
    }

    // Mark contest as having prizes distributed if all went well
    await prisma.fantasyContest.update({
      where: { id: contest.id },
      data: { 
        isPrizesDistributed: true,
        isPrizesProcessing: false
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Prize distribution completed',
      tournamentId,
      contestId,
      prizePool,
      prizeDisbursements
    });
  } catch (error) {
    console.error('Error distributing prizes:', error);
    return NextResponse.json(
      { error: 'Failed to distribute prizes' },
      { status: 500 }
    );
  }
}

// Helper function to get ordinal suffix
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
} 