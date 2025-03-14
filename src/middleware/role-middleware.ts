// src/middleware/role-middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

type AllowedRoles = "PLAYER" | "REFEREE" | "TOURNAMENT_ADMIN" | "MASTER_ADMIN";

export function roleMiddleware(allowedRoles: AllowedRoles[]) {
  return async (request: NextRequest) => {
    // Check for token in headers
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    try {
      // Verify token
      const decoded = verifyToken(token);

      if (!decoded || !decoded.role) {
        return NextResponse.json({ message: "Invalid token" }, { status: 401 });
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(decoded.role as AllowedRoles)) {
        return NextResponse.json(
          { message: "Insufficient permissions" },
          { status: 403 }
        );
      }

      // Add user to request
      (request as any).user = decoded;

      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
  };
}
