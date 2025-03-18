import { ZodError } from "zod";

// Comprehensive Error Types
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  DATABASE_ERROR = "DATABASE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

// Detailed Error Structure
export interface ApiErrorResponse {
  type: ErrorType;
  message: string;
  details?: string;
  errors?: Record<string, string>;
  status: number;
}

// Custom API Error Class
export class ApiError extends Error {
  type: ErrorType;
  status: number;
  errors?: Record<string, string>;

  constructor(
    type: ErrorType,
    message: string,
    status: number = 500,
    errors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.status = status;
    this.errors = errors;
  }

  // Convert error to standardized response
  toResponse(): ApiErrorResponse {
    return {
      type: this.type,
      message: this.message,
      details: this.stack,
      errors: this.errors,
      status: this.status,
    };
  }
}

// Error Factory Functions
export function createValidationError(
  message: string,
  errors?: Record<string, string>
): ApiError {
  return new ApiError(
    ErrorType.VALIDATION_ERROR,
    message || "Validation failed",
    400,
    errors
  );
}

export function createAuthenticationError(
  message: string = "Authentication failed"
): ApiError {
  return new ApiError(ErrorType.AUTHENTICATION_ERROR, message, 401);
}

export function createAuthorizationError(
  message: string = "Not authorized"
): ApiError {
  return new ApiError(ErrorType.AUTHORIZATION_ERROR, message, 403);
}

export function createNotFoundError(
  message: string = "Resource not found"
): ApiError {
  return new ApiError(ErrorType.NOT_FOUND, message, 404);
}

export function createDatabaseError(
  message: string = "Database operation failed"
): ApiError {
  return new ApiError(ErrorType.DATABASE_ERROR, message, 500);
}

// Error Conversion Utility
export function convertToApiError(error: unknown): ApiError {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors: Record<string, string> = {};
    error.errors.forEach((err) => {
      const path = err.path.join(".");
      validationErrors[path] = err.message;
    });

    return createValidationError("Validation failed", validationErrors);
  }

  // Handle existing ApiErrors
  if (error instanceof ApiError) {
    return error;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new ApiError(ErrorType.UNEXPECTED_ERROR, error.message, 500);
  }

  // Handle unknown errors
  return new ApiError(
    ErrorType.UNEXPECTED_ERROR,
    "An unexpected error occurred",
    500
  );
}
