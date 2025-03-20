import Razorpay from 'razorpay';
import crypto from 'crypto';
import { RazorpayOrderParams, RazorpayOrderCreationResponse } from '@/types/razorpay';

// Initialize Razorpay with API keys
const getRazorpayClient = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys are not set in environment variables');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * Create a new order in Razorpay
 * @param params Order parameters
 * @returns Order object
 */
export const createRazorpayOrder = async (
  params: RazorpayOrderParams
): Promise<RazorpayOrderCreationResponse> => {
  try {
    const razorpay = getRazorpayClient();
    
    // Razorpay expects amount in smallest currency unit (paise for INR)
    const orderParams = {
      ...params,
      amount: params.amount * 100,
      currency: params.currency || 'INR',
    };
    
    console.log('Creating Razorpay order with params:', orderParams);
    
    // Create order
    const order = await razorpay.orders.create(orderParams);
    console.log('Razorpay order created:', order);
    
    // Cast the response to match our expected type
    return {
      id: order.id,
      entity: order.entity,
      amount: Number(order.amount),
      amount_paid: Number(order.amount_paid),
      amount_due: Number(order.amount_due),
      currency: order.currency,
      receipt: order.receipt || '',
      status: order.status,
      attempts: order.attempts,
      notes: Object.fromEntries(
        Object.entries(order.notes || {}).map(([key, value]) => [key, String(value)])
      ),
      created_at: order.created_at
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify the Razorpay payment signature
 * @param orderId Razorpay order ID
 * @param paymentId Razorpay payment ID
 * @param signature Razorpay signature
 * @returns Boolean indicating if the signature is valid
 */
export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_secret) {
      throw new Error('Razorpay secret key is not set in environment variables');
    }
    
    // Create a HMAC SHA256 hash of the orderId + paymentId
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');
    
    // Compare the calculated signature with the received signature
    const isValid = expectedSignature === signature;
    console.log('Signature verification:', isValid ? 'Valid' : 'Invalid');
    
    return isValid;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
};

/**
 * Calculate payment splits between prize pool and MatchUp platform
 * PRIZE_POOL_PERCENTAGE is exactly 77.64% as specified
 */
export function calculatePaymentSplits(totalAmount: number) {
  // The percentage that goes to prize pool (77.64%)
  const PRIZE_POOL_PERCENTAGE = 77.64;
  
  // Calculate prize pool share (77.64% of total amount)
  const prizePoolShare = (totalAmount * PRIZE_POOL_PERCENTAGE) / 100;
  
  // Remaining amount (22.36%) stays with the platform
  const remainingAmount = totalAmount - prizePoolShare;
  
  return {
    remainingAmount, // 22.36% split between platform, Razorpay fees, etc.
    prizePoolShare,  // 77.64% goes to prize pool
    totalAmount,
    prizePoolPercentage: PRIZE_POOL_PERCENTAGE
  };
}

/**
 * Get payment details from Razorpay
 * @param paymentId Razorpay payment ID
 * @returns Payment details
 */
export const getPaymentDetails = async (paymentId: string) => {
  try {
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}; 