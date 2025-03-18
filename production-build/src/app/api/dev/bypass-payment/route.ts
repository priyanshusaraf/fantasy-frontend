import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Development-only route to bypass payment processing
 * This route should NEVER be used in production
 */
export async function POST(request: NextRequest) {
  // Ensure this is only used in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { tournamentId, teamId, amount } = data;

    if (!tournamentId || !teamId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a mock payment
    const mockPayment = {
      id: `dev_payment_${Date.now()}`,
      amount: amount || 100,
      currency: "INR",
      status: "success",
      method: "dev_bypass"
    };

    // Record this mock payment in the database
    // This would normally be connected to your payment table

    // Set environment variable for the session
    process.env.BYPASS_RAZORPAY = "true";

    return NextResponse.json({
      success: true,
      message: "Development payment bypass activated",
      payment: mockPayment
    });
  } catch (error) {
    console.error("Error in bypass payment endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 