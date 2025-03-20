// src/lib/jwt.ts
import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '@/lib/env';

// Define types for the payload
interface TokenPayload {
  id: number | string;
  email: string;
  role?: string;
  [key: string]: any; // Allow for additional properties
}

// Get the JWT secret from environment variables
const JWT_SECRET: Secret = env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-production';

/**
 * Sign a JWT token with the given payload
 */
export function signJwtToken(payload: TokenPayload, expiresIn: string = '30d'): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 */
export function verifyJwtToken<T = TokenPayload>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Generate a password reset token
 */
export function generatePasswordResetToken(userId: number | string, email: string): string {
  // Short lived token for password reset (1 hour)
  return signJwtToken({ id: userId, email, type: 'password-reset' }, '1h');
}

/**
 * Verify a password reset token
 */
export function verifyPasswordResetToken(token: string): { id: number | string; email: string } | null {
  const decoded = verifyJwtToken<{ id: number | string; email: string; type: string }>(token);
  
  if (!decoded || decoded.type !== 'password-reset') {
    return null;
  }
  
  return { id: decoded.id, email: decoded.email };
}
