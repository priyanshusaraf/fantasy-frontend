// src/app/api/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateWithGoogle } from "@/lib/auth/google-auth";
import { errorHandler } from "@/middleware/error-handler";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: "Google token is required" },
        { status: 400 }
      );
    }

    const result = await authenticateWithGoogle(token);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}
