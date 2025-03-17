import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createRazorpayOrder, calculatePaymentSplits } from "@/lib/razorpay";
import { createOrderSchema, validateData } from "@/utils/validation";
import LRUCache from 'lru-cache';

// Inline rate limiter for payment endpoints
function createPaymentRateLimiter() {
  const tokenCache = new LRUCache<string, number[]>({
    max: 100,
    ttl: 60 * 1000, // 1 minute
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
        } else {
          tokenCount[0] = tokenCount[0] + 1;
          tokenCache.set(token, tokenCount);
        }
        
        if (tokenCount[0] > limit) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}

/**
 * POST /api/payments/create-order
 * Create a new Razorpay order for fantasy tournament entry
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Apply specific rate limiting for payment endpoints
    const limiter = createPaymentRateLimiter();
    
    // Use user ID for rate limiting to prevent abuse
    const userId = session.user.id;
    
    try {
      await limiter.check(3, `payment_${userId}`); // 3 payment requests per minute per user
    } catch (error) {
      return NextResponse.json(
        { message: "Too many payment requests, please try again later" },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate input with Zod schema
    const validation = validateData(createOrderSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validation.error },
        { status: 400 }
      );
    }

    // Type assertion to ensure data is available and properly typed
    const validData = validation.data!;
    const { tournamentId, amount, currency = "INR" } = validData;

    // Validate tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: Number(tournamentId) }
    });

    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }
    
    // Get tournament organizer
    const tournamentAdmin = await prisma.tournamentAdmin.findUnique({
      where: { id: tournament.organizerId },
      include: {
        user: true
      }
    });

    // Check if fantasy is enabled for this tournament
    const fantasySettings = tournament.fantasySettings ? 
      JSON.parse(tournament.fantasySettings as string) : null;
    
    if (!fantasySettings?.enableFantasy) {
      return NextResponse.json(
        { message: "Fantasy is not enabled for this tournament" },
        { status: 400 }
      );
    }

    // Check if amount is within the allowed range (security measure)
    const minAmount = fantasySettings.minEntryFee || 0;
    const maxAmount = fantasySettings.maxEntryFee || 100000;
    
    if (amount < minAmount || amount > maxAmount) {
      return NextResponse.json(
        { message: `Payment amount must be between ${minAmount} and ${maxAmount}` },
        { status: 400 }
      );
    }

    // Create unique receipt ID with security hash
    const timestamp = Date.now();
    const securityHash = require('crypto')
      .createHash('sha256')
      .update(`${userId}-${tournamentId}-${timestamp}-${process.env.NEXTAUTH_SECRET}`)
      .digest('hex')
      .substring(0, 10);
      
    const receipt = `fantasy_${tournamentId}_${userId}_${timestamp}_${securityHash}`;

    // Create order in Razorpay
    const order = await createRazorpayOrder({
      amount: Number(amount),
      currency,
      receipt,
      notes: {
        userId: userId,
        tournamentId: String(tournamentId),
        type: "fantasy_entry"
      }
    });

    // For tracking purposes, we'll use a unique ID for the payment with additional security
    const tempPaymentId = `temp_payment_${timestamp}_${securityHash}`;
    
    // Calculate payment splits (will be applied after payment completion)
    const splits = calculatePaymentSplits(Number(amount));

    // Log payment attempt for audit
    console.log(`Payment order created: ${order.id} for user: ${userId}, tournament: ${tournamentId}`);

    // Return order details and payment info
    // Note: Only return what's necessary for the frontend
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount / 100, // Convert back to main currency unit
      currency: order.currency,
      tempPaymentId,
      receipt: order.receipt,
      keyId: process.env.RAZORPAY_KEY_ID,
      splits,
      metadata: {
        userId: userId,
        tournamentId: Number(tournamentId),
        timestamp
      }
    });
    
  } catch (error) {
    console.error("Error creating payment order:", error);
    
    // Don't expose internal error details to the client
    return NextResponse.json(
      { message: "Failed to create payment order. Please try again later." },
      { status: 500 }
    );
  }
} 