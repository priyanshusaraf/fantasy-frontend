import { NextResponse } from 'next/server';

/**
 * Add security headers to a Next.js response
 * @param response The NextResponse object to add headers to
 * @returns The response with security headers added
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://assets.razorpay.com; connect-src 'self' https://*.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com;"
  );

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Set strict transport security for 1 year
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  
  // Prevent browsers from trying to detect the content type
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Disable browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

/**
 * Generate a random string using Web Crypto API
 * @param length The length of the random string
 * @returns A random hex string
 */
function getRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined') {
    // Browser environment
    window.crypto.getRandomValues(bytes);
  } else if (typeof crypto !== 'undefined') {
    // Edge Runtime or Node.js with webcrypto
    crypto.getRandomValues(bytes);
  }
  
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a CSRF token
 * @param userId User ID to associate with the token
 * @returns The CSRF token
 */
export function generateCsrfToken(userId: string | number): string {
  const timestamp = Date.now();
  const randomString = getRandomString(18);
  
  // Create a simple token with timestamp
  return `${timestamp}.${randomString}.${userId}`;
}

/**
 * Verify a CSRF token
 * @param token The token to verify
 * @param userId The user ID the token should be associated with
 * @param maxAge Maximum age of the token in milliseconds (default: 1 hour)
 * @returns Whether the token is valid
 */
export function verifyCsrfToken(
  token: string,
  userId: string | number,
  maxAge: number = 3600000 // 1 hour
): boolean {
  try {
    const [timestamp, randomString, tokenUserId] = token.split('.');
    
    // Check if the token has a valid format
    if (!timestamp || !randomString || !tokenUserId) {
      return false;
    }
    
    // Check if the token has expired
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime) || Date.now() > tokenTime + maxAge) {
      return false;
    }
    
    // Check if the user ID matches
    if (tokenUserId !== String(userId)) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input The input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Create a nonce for CSP
 * @returns A random nonce value
 */
export function createCspNonce(): string {
  const bytes = getRandomString(16);
  // Convert to base64-like format
  return btoa(bytes);
}

/**
 * Check if an API key is valid
 * @param apiKey The API key to check
 * @param validKeys Array of valid API keys
 * @returns Whether the API key is valid
 */
export function isValidApiKey(apiKey: string, validKeys: string[]): boolean {
  if (!apiKey) return false;
  
  // Simplified version that doesn't use constant-time comparison
  // Note: This is not as secure against timing attacks
  return validKeys.includes(apiKey);
} 