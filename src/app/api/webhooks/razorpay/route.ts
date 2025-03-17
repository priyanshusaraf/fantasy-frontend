import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/webhooks/razorpay
 * Webhook handler for Razorpay events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the webhook signature from headers
    const razorpaySignature = request.headers.get('x-razorpay-signature');
    
    if (!razorpaySignature) {
      console.error('Webhook Error: No Razorpay signature provided');
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }
    
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Webhook Error: Webhook secret not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    
    // Get the raw body as text
    const rawBody = await request.text();
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    if (expectedSignature !== razorpaySignature) {
      console.error('Webhook Error: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse the webhook data
    const webhookData = JSON.parse(rawBody);
    const { event, payload } = webhookData;
    
    console.log(`Received Razorpay webhook: ${event}`, webhookData);
    
    // Handle different webhook events
    switch (event) {
      case 'payout.processed':
        await handlePayoutProcessed(payload.payout.entity);
        break;
        
      case 'payout.failed':
        await handlePayoutFailed(payload.payout.entity);
        break;
        
      case 'payout.reversed':
        await handlePayoutReversed(payload.payout.entity);
        break;
        
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle payout.processed event
 */
async function handlePayoutProcessed(payout: any) {
  const { id: payoutId, reference_id: referenceId } = payout;
  
  try {
    // Update the prize disbursement status
    const updatedDisbursement = await prisma.prizeDisbursement.updateMany({
      where: { payoutId },
      data: {
        status: 'SUCCESS',
        processedAt: new Date()
      }
    });
    
    console.log(`Updated prize disbursement for payout ${payoutId}`, updatedDisbursement);
    
    // Create transaction record if needed
    
    // Send notification to user
  } catch (error) {
    console.error(`Error handling processed payout ${payoutId}:`, error);
  }
}

/**
 * Handle payout.failed event
 */
async function handlePayoutFailed(payout: any) {
  const { id: payoutId, failure_reason: failureReason } = payout;
  
  try {
    // Update the prize disbursement status
    const updatedDisbursement = await prisma.prizeDisbursement.updateMany({
      where: { payoutId },
      data: {
        status: 'FAILED',
        failureReason: failureReason || 'Unknown failure reason',
        processedAt: new Date()
      }
    });
    
    console.log(`Updated failed prize disbursement for payout ${payoutId}`, updatedDisbursement);
    
    // Send notification to admin
  } catch (error) {
    console.error(`Error handling failed payout ${payoutId}:`, error);
  }
}

/**
 * Handle payout.reversed event
 */
async function handlePayoutReversed(payout: any) {
  const { id: payoutId } = payout;
  
  try {
    // Update the prize disbursement status
    const updatedDisbursement = await prisma.prizeDisbursement.updateMany({
      where: { payoutId },
      data: {
        status: 'REVERSED',
        processedAt: new Date()
      }
    });
    
    console.log(`Updated reversed prize disbursement for payout ${payoutId}`, updatedDisbursement);
    
    // Create transaction record if needed
    
    // Send notification to admin and user
  } catch (error) {
    console.error(`Error handling reversed payout ${payoutId}:`, error);
  }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payment: any) {
  const { id: paymentId, order_id: orderId, amount, notes } = payment;
  
  try {
    // Check if this payment is for a fantasy contest entry
    if (notes && notes.type === 'fantasy_entry') {
      const { contestId, teamId, userId } = notes;
      
      // Update payment record
      await prisma.payment.updateMany({
        where: { razorpayPaymentId: paymentId },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });
      
      console.log(`Updated payment ${paymentId} to COMPLETED`);
      
      // Update FantasyTeam if needed (e.g., set as active)
      if (teamId) {
        await prisma.fantasyTeam.updateMany({
          where: { id: parseInt(teamId) },
          data: { isActive: true }
        });
        
        console.log(`Activated fantasy team ${teamId}`);
      }
      
      // Update contest entry count
      if (contestId) {
        await prisma.fantasyContest.update({
          where: { id: parseInt(contestId) },
          data: {
            currentEntries: {
              increment: 1
            }
          }
        });
        
        console.log(`Incremented entry count for contest ${contestId}`);
      }
      
      // Send notification to user
    }
  } catch (error) {
    console.error(`Error handling captured payment ${paymentId}:`, error);
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment: any) {
  const { id: paymentId, order_id: orderId, error_code: errorCode, error_description: errorDescription } = payment;
  
  try {
    // Update payment record
    await prisma.payment.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: {
        status: 'FAILED',
        metadata: { errorCode, errorDescription },
        updatedAt: new Date()
      }
    });
    
    console.log(`Updated payment ${paymentId} to FAILED`);
    
    // Send notification to user
  } catch (error) {
    console.error(`Error handling failed payment ${paymentId}:`, error);
  }
} 