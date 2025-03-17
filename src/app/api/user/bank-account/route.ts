import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFundAccount } from "@/lib/razorpay-payout";

/**
 * Endpoint to add or update a user's bank account details for payouts
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    const { accountHolderName, accountNumber, ifsc } = data;
    if (!accountHolderName || !accountNumber || !ifsc) {
      return NextResponse.json(
        { error: "Missing required fields (accountHolderName, accountNumber, ifsc)" },
        { status: 400 }
      );
    }
    
    // Validate IFSC code format (Indian Financial System Code)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc)) {
      return NextResponse.json(
        { error: "Invalid IFSC code format" },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if we need to bypass Razorpay in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const bypassRazorpay = isDev && process.env.BYPASS_RAZORPAY === 'true';
    
    let fundAccountId = null;
    let contactId = null;
    
    if (!bypassRazorpay) {
      try {
        // Create the fund account in Razorpay
        const fundAccountResult = await createFundAccount(userId, {
          name: accountHolderName,
          ifsc: ifsc,
          accountNumber: accountNumber,
          accountType: data.accountType || "savings"
        });
        
        fundAccountId = fundAccountResult.fundAccountId;
        contactId = fundAccountResult.contactId;
      } catch (error) {
        console.error("Error creating fund account in Razorpay:", error);
        return NextResponse.json(
          { error: "Failed to create payment account. Please try again." },
          { status: 500 }
        );
      }
    } else {
      // In development with bypass enabled, generate mock IDs
      fundAccountId = `dev_fund_account_${Date.now()}`;
      contactId = `dev_contact_${Date.now()}`;
    }
    
    // Store the bank account details in the database
    // First check if the user already has bank account details
    const existingBankAccount = await prisma.bankAccount.findFirst({
      where: { userId: parseInt(userId) }
    });
    
    if (existingBankAccount) {
      // Update existing bank account
      await prisma.bankAccount.update({
        where: { id: existingBankAccount.id },
        data: {
          accountHolderName,
          accountNumber: `XXXX${accountNumber.slice(-4)}`, // Store masked for security
          ifsc,
          accountType: data.accountType || "savings",
          razorpayFundAccountId: fundAccountId,
          razorpayContactId: contactId,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new bank account
      await prisma.bankAccount.create({
        data: {
          userId: parseInt(userId),
          accountHolderName,
          accountNumber: `XXXX${accountNumber.slice(-4)}`, // Store masked for security
          ifsc,
          accountType: data.accountType || "savings",
          razorpayFundAccountId: fundAccountId,
          razorpayContactId: contactId
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Bank account details saved successfully"
    });
    
  } catch (error) {
    console.error("Error saving bank account details:", error);
    return NextResponse.json(
      { error: "Failed to save bank account details" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint to get user's bank account details
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get the user's bank account details
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { userId: parseInt(userId) },
      select: {
        id: true,
        accountHolderName: true,
        accountNumber: true, // Already masked when stored
        ifsc: true,
        accountType: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true
      }
    });
    
    if (!bankAccount) {
      return NextResponse.json({
        success: true,
        hasBankAccount: false,
        message: "No bank account details found for this user"
      });
    }
    
    return NextResponse.json({
      success: true,
      hasBankAccount: true,
      bankAccount
    });
    
  } catch (error) {
    console.error("Error retrieving bank account details:", error);
    return NextResponse.json(
      { error: "Failed to retrieve bank account details" },
      { status: 500 }
    );
  }
} 