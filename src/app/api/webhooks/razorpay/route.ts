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
      // Still return 200 to prevent Razorpay from retrying - we'll handle failures internally
      return NextResponse.json({ error: 'No signature provided', status: 'received' }, { status: 200 });
    }
    
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Webhook Error: Webhook secret not configured');
      // Return 200 but log the error - this prevents Razorpay from retrying
      return NextResponse.json({ error: 'Webhook secret not configured', status: 'received' }, { status: 200 });
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
      // Return 200 but log the error - this prevents Razorpay from retrying
      return NextResponse.json({ error: 'Invalid signature', status: 'received' }, { status: 200 });
    }
    
    // Parse the webhook data
    const webhookData = JSON.parse(rawBody);
    const { event, payload } = webhookData;
    
    console.log(`Received Razorpay webhook: ${event}`);
    
    // Handle different webhook events
    try {
      switch (event) {
        case 'payment.captured':
          // Handle payment captured
          console.log('Payment captured:', payload.payment.entity.id);
          break;
          
        case 'payment.failed':
          // Handle payment failed
          console.log('Payment failed:', payload.payment.entity.id);
          break;
          
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }
    } catch (eventError) {
      // Don't throw errors from event processing
      // This prevents the webhook from failing if a specific handler fails
      console.error(`Error processing webhook event ${event}:`, eventError);
    }
    
    return NextResponse.json({ received: true, status: 'success' });
  } catch (error) {
    console.error('Webhook Error:', error);
    
    // Always return 200 to avoid Razorpay retrying the webhook
    // This is important since we don't want duplicate event processing
    return NextResponse.json(
      { error: 'Webhook processing failed', status: 'received' },
      { status: 200 }
    );
  }
} 