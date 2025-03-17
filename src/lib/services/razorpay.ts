import Razorpay from 'razorpay';

interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

interface CreatePayoutParams {
  accountNumber: string;
  ifscCode: string;
  amount: number; // Amount in lowest currency unit (paise)
  name: string;
  notes?: Record<string, string>;
  accountType?: 'bank_account' | 'vpa';
  reference?: string;
}

interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export class RazorpayService {
  private razorpay: Razorpay;
  private fundAccountIds: Map<string, string> = new Map(); // Cache for fund account IDs

  constructor() {
    // Initialize Razorpay with API keys
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });

    // Throw error if keys are not set
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('Razorpay API keys not set. Running in mock mode.');
    }
  }

  /**
   * Create a new order in Razorpay
   */
  async createOrder(params: CreateOrderParams) {
    const { amount, currency = 'INR', receipt, notes } = params;

    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Create order options
      const options = {
        amount: Math.round(amount), // Amount in smallest currency unit (paise)
        currency,
        receipt,
        notes,
      };

      // Create order in Razorpay
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error(error.message || 'Failed to create order');
    }
  }

  /**
   * Create a payout to a bank account (prize distribution)
   */
  async createPayout(params: CreatePayoutParams) {
    const { accountNumber, ifscCode, amount, name, notes, accountType = 'bank_account', reference } = params;

    // For development mode - return mock payout if env var is set
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_RAZORPAY === 'true') {
      return this.createMockPayout(params);
    }

    try {
      // Step 1: Create a contact for the recipient
      const contact = await this.razorpay.contacts.create({
        name,
        notes,
      });

      // Step 2: Create a fund account for the recipient
      const fundAccountOptions = accountType === 'bank_account' 
        ? {
            contact_id: contact.id,
            account_type: accountType,
            bank_account: {
              name,
              ifsc: ifscCode,
              account_number: accountNumber,
            },
          }
        : {
            contact_id: contact.id,
            account_type: 'vpa',
            vpa: {
              address: accountNumber,
            },
          };

      const fundAccount = await this.razorpay.fundAccount.create(fundAccountOptions);

      // Cache the fund account ID for future payouts
      const cacheKey = `${accountNumber}-${ifscCode}`;
      this.fundAccountIds.set(cacheKey, fundAccount.id);

      // Step 3: Create a payout
      const payout = await this.razorpay.payout.create({
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id: fundAccount.id,
        amount,
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference: reference || `payout-${Date.now()}`,
        narration: 'Prize payout',
        notes,
      });

      return payout;
    } catch (error) {
      console.error('Error creating Razorpay payout:', error);
      throw new Error(error.message || 'Failed to create payout');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    
    if (!secret) {
      console.warn('Razorpay webhook secret not set. Signature verification skipped.');
      return true;
    }
    
    try {
      return Razorpay.validateWebhookSignature(payload, signature, secret);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature({ orderId, paymentId, signature }: VerifySignatureParams) {
    try {
      // Generate a signature using the secret key and order ID + payment ID
      const generatedSignature = this.generateSignature(orderId, paymentId);
      
      // Compare the generated signature with the provided signature
      return generatedSignature === signature;
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Generate a signature for payment verification
   */
  private generateSignature(orderId: string, paymentId: string) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(orderId + '|' + paymentId);
    return hmac.digest('hex');
  }

  /**
   * Create a mock payout (for development testing)
   */
  private createMockPayout(params: CreatePayoutParams) {
    const { amount, name, notes } = params;
    
    return {
      id: `payout_mock_${Date.now()}`,
      entity: 'payout',
      fund_account_id: `fa_mock_${Date.now()}`,
      amount,
      currency: 'INR',
      notes: notes || {},
      fees: Math.round(amount * 0.0236), // Simulate 2.36% fee
      tax: 0,
      status: 'processing',
      purpose: 'payout',
      utr: `UTR_MOCK_${Math.floor(Math.random() * 1000000)}`,
      mode: 'IMPS',
      reference_id: `ref_mock_${Date.now()}`,
      narration: `Prize payout to ${name}`,
      batch_id: null,
      failure_reason: null,
      created_at: Math.floor(Date.now() / 1000),
      _mock: true, // Indicator that this is a mock response
    };
  }
} 