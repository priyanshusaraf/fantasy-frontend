// src/lib/jwt.ts
import jwt, {
  JwtPayload,
  Secret,
  SignOptions,
  VerifyOptions,
} from "jsonwebtoken";

// Define a type for the token payload
export interface TokenPayload {
  id?: number;
  email: string;
  role: string;
}

export function generateToken(
  payload: TokenPayload,
  expiresIn: number = 3600 // Default to 1 hour in seconds
): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT secret is not defined");
  }

  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign(payload, secret as Secret, options);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT secret is not defined");
    }

    const options: VerifyOptions = {
      complete: false,
    };

    return jwt.verify(token, secret as Secret, options) as JwtPayload;
  } catch {
    return null;
  }
}
