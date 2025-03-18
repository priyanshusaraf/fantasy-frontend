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
 * Calculate payment splits for fantasy tournament
 * @param amount Total payment amount in currency's smallest unit (e.g., paise for INR)
 * @returns Object containing split amounts
 */
export const calculatePaymentSplits = (amount: number) => {
  // Convert from paise to rupees if needed
  const totalAmount = amount;
  
  // Tournament admin gets 10%
  const tournamentAdminShare = Math.round(totalAmount * 0.1);
  
  // Master admin gets 10%
  const masterAdminShare = Math.round(totalAmount * 0.1);
  
  // Prize pool gets 80%
  const prizePoolShare = totalAmount - tournamentAdminShare - masterAdminShare;
  
  return {
    tournamentAdminShare,
    masterAdminShare,
    prizePoolShare,
    totalAmount,
  };
};

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