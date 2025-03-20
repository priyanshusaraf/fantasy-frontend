import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { createRazorpayOrder } from "@/lib/razorpay";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }
    
    // Get authenticated user
    const { user } = request as any;
    
    // Parse request body
    const { amount, contestId, type, description } = await request.json();
    
    if (!amount || !contestId || !type) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Validate contest
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: Number(contestId) },
      include: { tournament: true },
    });
    
    if (!contest) {
      return NextResponse.json(
        { message: "Contest not found" },
        { status: 404 }
      );
    }
    
    if (contest.status !== "OPEN" && contest.status !== "DRAFT") {
      return NextResponse.json(
        { message: "Contest is not open for registration" },
        { status: 400 }
      );
    }
    
    // Generate receipt ID
    const receipt = `order_${Date.now()}_${user.id}_${contestId}`;
    
    // Create Razorpay order
    const order = await createRazorpayOrder({
      amount: Number(amount),
      currency: "INR",
      receipt,
      notes: {
        userId: user.id,
        contestId,
        tournamentId: contest.tournamentId,
        type,
      },
    });
    
    // Save order in database
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: amount.toString(),
        currency: "INR",
        status: "PENDING",
        description: description || `Entry fee for contest #${contestId}`,
        razorpayOrderId: order.id,
        metadata: {
          contestId,
          tournamentId: contest.tournamentId,
          type,
        },
        fantasyContestId: Number(contestId),
      },
    });
    
    return NextResponse.json({ 
      order,
      payment: {
        id: payment.id,
        status: payment.status,
      }
    });
    
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { message: "Failed to create payment order", error: String(error) },
      { status: 500 }
    );
  }
} 