// src/middleware/error-handler.ts
import { NextRequest, NextResponse } from "next/server";
import winston from "winston";

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Custom error classes
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Global error handling middleware
export function errorHandler(err: Error, req: NextRequest) {
  // Log the error
  logger.error(`Error in ${req.nextUrl.pathname}:`, {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Determine appropriate response based on error type
  switch (err.name) {
    case "ValidationError":
      return NextResponse.json(
        {
          message: "Validation Failed",
          details: err.message,
        },
        { status: 400 }
      );

    case "AuthenticationError":
      return NextResponse.json(
        {
          message: "Authentication Failed",
          details: err.message,
        },
        { status: 401 }
      );

    case "DatabaseError":
      return NextResponse.json(
        {
          message: "Database Error",
          details: err.message,
        },
        { status: 500 }
      );

    default:
      // For unexpected errors
      return NextResponse.json(
        {
          message: "Internal Server Error",
          details: "An unexpected error occurred",
        },
        { status: 500 }
      );
  }
}

// Utility for structured logging
export function logEvent(event: string, metadata?: Record<string, any>) {
  logger.info(event, metadata);
}
