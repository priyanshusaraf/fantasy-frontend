import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function authMiddleware(req: NextRequest) {
  const publicPaths = ["/login", "/register", "/reset-password", "/"];

  // Check if the path is public
  const path = req.nextUrl.pathname;
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // Check for token in headers
  const token = req.headers.get("authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // Attach user to request
    req.user = decoded;

    return NextResponse.next();
  } catch (error) {
    // Token is invalid
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
