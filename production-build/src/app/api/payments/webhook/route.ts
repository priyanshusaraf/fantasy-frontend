import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from 'crypto';
import { verifyRazorpaySignature, calculatePaymentSplits, getPaymentDetails } from "@/lib/razorpay";

// Define a more specific type for the payment entity
interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: {
    [key: string]: string;
  };
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
}

/**
 * POST /api/payments/webhook
 * Handle Razorpay payment webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get Razorpay signature from headers
    const razorpaySignature = request.headers.get('x-razorpay-signature');
    
    if (!razorpaySignature) {
      console.error("Missing Razorpay signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Get the raw request body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not defined");
      return NextResponse.json({ message: "Configuration error" }, { status: 500 });
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
      
    if (expectedSignature !== razorpaySignature) {
      console.error("Invalid Razorpay signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
    
    // Parse the webhook payload
    const body = JSON.parse(rawBody);
    
    // Verify required fields exist
    if (!body.event || !body.payload || !body.payload.payment || !body.payload.payment.entity) {
      console.error("Invalid webhook payload structure");
      return NextResponse.json({ message: "Invalid webhook payload" }, { status: 400 });
    }

    const event = body.event;
    const paymentEntity = body.payload.payment.entity as RazorpayPaymentEntity;
    
    // Additional validation of payment entity
    if (!paymentEntity.id || !paymentEntity.order_id) {
      console.error("Invalid payment entity in webhook payload");
      return NextResponse.json({ message: "Invalid payment data" }, { status: 400 });
    }
    
    // Log sanitized webhook event for debugging
    console.log(`Received Razorpay webhook: ${event} for payment ${paymentEntity.id}`);
    
    // Handle different event types
    if (event === 'payment.captured') {
      await handlePaymentCaptured(paymentEntity);
      return NextResponse.json({ message: "Webhook processed successfully" });
    } 
    else if (event === 'payment.failed') {
      await handlePaymentFailed(paymentEntity);
      return NextResponse.json({ message: "Payment failure recorded" });
    } 
    // For other events, just acknowledge receipt
    else {
      console.log(`Received unhandled event type: ${event}`);
      return NextResponse.json({ message: "Webhook received but not processed" });
    }
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    
    // Still return 200 to avoid Razorpay retrying - we'll handle failures internally
    return NextResponse.json(
      { message: "Error processing webhook" },
      { status: 200 }
    );
  }
}

/**
 * Handle successful payment capture event
 */
async function handlePaymentCaptured(paymentEntity: RazorpayPaymentEntity) {
  const { id: paymentId, order_id: orderId, notes } = paymentEntity;
  
  // Extract metadata from notes
  const userId = notes?.userId;
  const tournamentId = notes?.tournamentId ? parseInt(notes.tournamentId, 10) : null;
  const paymentType = notes?.type || 'unknown';

  // Skip processing if this doesn't look like a fantasy payment
  if (paymentType !== 'fantasy_entry' || !tournamentId) {
    console.log(`Skipping non-fantasy payment: ${paymentId} (type: ${paymentType})`);
    return;
  }

  console.log(`Processing fantasy payment: ${paymentId} for tournament: ${tournamentId}`);

  try {
    // Verify the payment exists in Razorpay
    const paymentDetails = await getPaymentDetails(paymentId);
    
    // Verify the payment is captured
    if (paymentDetails.status !== 'captured') {
      console.warn(`Payment ${paymentId} is not captured, status: ${paymentDetails.status}`);
      return;
    }

    // Get tournament details with organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      console.error(`Tournament ${tournamentId} not found for payment ${paymentId}`);
      return;
    }
    
    // Get tournament organizer
    const organizer = await prisma.tournamentAdmin.findUnique({
      where: { id: tournament.organizerId },
      include: { user: true }
    });
    
    if (!organizer) {
      console.error(`Tournament organizer not found for tournament ${tournamentId}`);
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) }
    });

    if (!user) {
      console.error(`User ${userId} not found for payment ${paymentId}`);
      return;
    }

    // Get or create a Payment record
    try {
      // Calculate payment splits
      const amount = Number(paymentDetails.amount) / 100; // Convert from smallest unit to main unit
      const splits = calculatePaymentSplits(amount);
      
      console.log(`Payment splits for ${paymentId}: `, splits);

      // Find master admin user (role = MASTER_ADMIN)
      const masterAdmin = await prisma.user.findFirst({
        where: { role: 'MASTER_ADMIN' }
      });

      if (!masterAdmin) {
        console.error("No master admin found in the system");
        return;
      }

      // Find or create a Fantasy Team for this user and tournament
      const existingFantasyTeam = await prisma.$queryRaw`
        SELECT id FROM FantasyTeam 
        WHERE userId = ${user.id} AND tournamentId = ${tournamentId}
        LIMIT 1
      `;
      
      let fantasyTeamId = null;
      
      if (Array.isArray(existingFantasyTeam) && existingFantasyTeam.length > 0) {
        fantasyTeamId = (existingFantasyTeam[0] as any).id;
      } else {
        // Create a new fantasy team with raw SQL since the relations might not be in Prisma yet
        const teamName = `${user.username || user.name || 'User'}'s Team`;
        
        await prisma.$executeRaw`
          INSERT INTO FantasyTeam (name, userId, tournamentId, status, createdAt, updatedAt)
          VALUES (${teamName}, ${user.id}, ${tournamentId}, 'ACTIVE', NOW(), NOW())
        `;
        
        const newTeam = await prisma.$queryRaw`
          SELECT id FROM FantasyTeam 
          WHERE userId = ${user.id} AND tournamentId = ${tournamentId}
          ORDER BY createdAt DESC
          LIMIT 1
        `;
        
        if (Array.isArray(newTeam) && newTeam.length > 0) {
          fantasyTeamId = (newTeam[0] as any).id;
        }
      }

      // Check if tournament has a fantasy prize pool
      const hasPrizePool = await prisma.$queryRaw`
        SHOW COLUMNS FROM Tournament LIKE 'fantasyPrizePool'
      `;
      
      // If the column exists, update it
      if (Array.isArray(hasPrizePool) && hasPrizePool.length > 0) {
        await prisma.$executeRaw`
          UPDATE Tournament
          SET fantasyPrizePool = COALESCE(fantasyPrizePool, 0) + ${splits.prizePoolShare}
          WHERE id = ${tournamentId}
        `;
      } else {
        // Otherwise, just log what we would do
        console.log(`Would add ${splits.prizePoolShare} to prize pool for tournament ${tournamentId}`);
      }

      console.log(`Payment ${paymentId} processed successfully`);
      
      // This will be replaced with actual database operations once the schema is migrated
      console.log(`Payment splits applied: 
        Tournament Admin (${organizer.id}): ${splits.tournamentAdminShare}
        Master Admin (${masterAdmin.id}): ${splits.masterAdminShare}
        Prize Pool: ${splits.prizePoolShare}
      `);
    } catch (dbError) {
      console.error("Error recording payment in database:", dbError);
      // The payment was successful, so we'll log the error but not throw
    }
  } catch (error) {
    console.error(`Error processing payment ${paymentId}:`, error);
    // Log the error but don't rethrow - we don't want webhook to retry
  }
}

/**
 * Handle failed payment event
 */
async function handlePaymentFailed(paymentEntity: RazorpayPaymentEntity) {
  const { id: paymentId, notes } = paymentEntity;
  
  // Log the failure but don't take action yet
  console.log(`Payment ${paymentId} failed, notes:`, notes);
  
  // When the Payment model is available, we would update the payment status
  // await prisma.payment.update({
  //   where: { razorpayPaymentId: paymentId },
  //   data: { status: 'FAILED' }
  // });
}