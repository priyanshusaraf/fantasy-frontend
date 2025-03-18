import Razorpay from 'razorpay';

// Define extended types for Razorpay since the typings might be incomplete
interface RazorpayPayoutMethods {
  create: (data: any) => Promise<any>;
  fetch: (id: string) => Promise<any>;
}

interface RazorpayContactMethods {
  create: (data: any) => Promise<any>;
}

interface RazorpayFundAccountMethods {
  create: (data: any) => Promise<any>;
}

interface ExtendedRazorpay extends Razorpay {
  payouts: RazorpayPayoutMethods;
  contacts: RazorpayContactMethods;
  fundAccounts: RazorpayFundAccountMethods;
}

// Initialize Razorpay with API keys
const getRazorpayClient = (): ExtendedRazorpay => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys are not set in environment variables');
  }

  return new Razorpay({
    key_id,
    key_secret,
  }) as ExtendedRazorpay;
};

interface PayoutParams {
  userId: string;
  amount: number;
  currency?: string;
  purpose?: string;
  narration?: string;
  bankAccount?: string;
  fundAccountId?: string;
  referenceId?: string;
}

/**
 * Create a payout to user's bank account
 */
export const createRazorpayPayout = async ({
  userId,
  amount,
  currency = 'INR',
  purpose = 'prize',
  narration = 'Fantasy Tournament Prize',
  fundAccountId,
  referenceId,
}: PayoutParams) => {
  try {
    const razorpay = getRazorpayClient();
    
    // Verify if we have the necessary payout credentials
    const accountNumber = process.env.RAZORPAY_ACCOUNT_NUMBER;
    if (!accountNumber) {
      throw new Error('Razorpay account number is not set in environment variables');
    }
    
    // Get user's fund account ID if not provided
    const userFundAccountId = fundAccountId || await getUserFundAccountId(userId);
    
    if (!userFundAccountId) {
      throw new Error(`User ${userId} has no linked bank account`);
    }
    
    // Generate a reference ID if not provided
    const payoutReferenceId = referenceId || `prize-${Date.now()}-${userId.substring(0, 8)}`;
    
    // Create payout
    const payout = await razorpay.payouts.create({
      account_number: accountNumber,
      fund_account_id: userFundAccountId,
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      mode: "IMPS",
      purpose,
      queue_if_low_balance: true,
      reference_id: payoutReferenceId,
      narration,
    });
    
    console.log(`Created payout for user ${userId}:`, payout);
    
    return {
      userId,
      payoutId: payout.id,
      status: payout.status,
      amount: Number(payout.amount) / 100, // Convert from paise to main unit
      currency: payout.currency,
      referenceId: payoutReferenceId,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating payout:', error);
    throw error;
  }
};

/**
 * Get the status of a payout
 */
export const getPayoutStatus = async (payoutId: string) => {
  try {
    const razorpay = getRazorpayClient();
    const payout = await razorpay.payouts.fetch(payoutId);
    
    return {
      payoutId: payout.id,
      status: payout.status,
      amount: Number(payout.amount) / 100, // Convert from paise to main unit
      currency: payout.currency,
      failureReason: payout.failure_reason || null,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error(`Error getting payout status for ${payoutId}:`, error);
    throw error;
  }
};

/**
 * Creates a fund account for a user
 * This should be used when a user adds their bank details
 */
export const createFundAccount = async (
  userId: string, 
  bankDetails: {
    name: string;
    ifsc: string;
    accountNumber: string;
    accountType?: string;
  }
) => {
  try {
    const razorpay = getRazorpayClient();
    
    // Create a contact if one doesn't exist yet
    const contactIdResult = await getUserContactId(userId);
    let contactId: string;
    
    if (!contactIdResult) {
      // Get user details from database
      // For this example, we'll assume we have the user object
      const user = { id: userId, name: bankDetails.name };
      
      const contact = await razorpay.contacts.create({
        name: user.name,
        reference_id: `user-${user.id}`,
        type: "customer",
      });
      
      contactId = contact.id;
      
      // In a real app, you should store this contact ID in your database
      await storeUserContactId(userId, contactId);
    } else {
      contactId = contactIdResult;
    }
    
    // Create fund account
    const fundAccount = await razorpay.fundAccounts.create({
      contact_id: contactId,
      account_type: "bank_account",
      bank_account: {
        name: bankDetails.name,
        ifsc: bankDetails.ifsc,
        account_number: bankDetails.accountNumber,
        account_type: bankDetails.accountType || "savings"
      }
    });
    
    // In a real app, store this fund account ID in your database
    await storeUserFundAccountId(userId, fundAccount.id);
    
    return {
      userId,
      contactId,
      fundAccountId: fundAccount.id,
      status: "created"
    };
  } catch (error) {
    console.error(`Error creating fund account for user ${userId}:`, error);
    throw error;
  }
};

// These are placeholder functions that would be implemented in a real app
// to store and retrieve user's Razorpay information

async function getUserFundAccountId(userId: string): Promise<string | null> {
  // In a real app, you would get this from your database
  console.log(`[MOCK] Getting fund account ID for user ${userId}`);
  return null;
}

async function getUserContactId(userId: string): Promise<string | null> {
  // In a real app, you would get this from your database
  console.log(`[MOCK] Getting contact ID for user ${userId}`);
  return null;
}

async function storeUserContactId(userId: string, contactId: string): Promise<void> {
  // In a real app, you would store this in your database
  console.log(`[MOCK] Storing contact ID ${contactId} for user ${userId}`);
}

async function storeUserFundAccountId(userId: string, fundAccountId: string): Promise<void> {
  // In a real app, you would store this in your database
  console.log(`[MOCK] Storing fund account ID ${fundAccountId} for user ${userId}`);
} 