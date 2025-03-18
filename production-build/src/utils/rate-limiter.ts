import { NextRequest, NextResponse } from "next/server";

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private options: RateLimiterOptions) {}

  // Check if the request should be allowed
  check(req: NextRequest): boolean {
    const ip = req.ip || "unknown";
    const now = Date.now();

    // Get existing requests for this IP
    const existingRequests = this.requests.get(ip) || [];

    // Filter out requests outside the time window
    const recentRequests = existingRequests.filter(
      (timestamp) => now - timestamp < this.options.windowMs
    );

    // Check if we've exceeded max requests
    if (recentRequests.length >= this.options.maxRequests) {
      return false;
    }

    // Add current request timestamp
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);

    return true;
  }

  // Middleware for rate limiting
  middleware(req: NextRequest): NextResponse | null {
    if (!this.check(req)) {
      return NextResponse.json(
        {
          message: "Too Many Requests",
          details: "You have exceeded the rate limit",
        },
        { status: 429 }
      );
    }
    return null;
  }
}

// Example usage of rate limiter
const loginRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});
