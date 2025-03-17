# API Security Documentation

## Overview

This document outlines the security measures implemented in our Final Fantasy App API to ensure data protection, prevent unauthorized access, and mitigate common web vulnerabilities.

## Security Measures

### Authentication and Authorization

1. **JWT Authentication**
   - All API endpoints (except explicitly public ones) require authentication via JWT tokens
   - Tokens are verified using the `getToken` function from NextAuth.js
   - Tokens include user role information for authorization checks

2. **Role-Based Access Control (RBAC)**
   - API routes are protected based on user roles
   - Admin routes require `MASTER_ADMIN` role
   - Referee routes require `REFEREE`, `TOURNAMENT_ADMIN`, or `MASTER_ADMIN` role
   - Tournament management requires appropriate tournament admin permissions

### Input Validation and Sanitization

1. **Zod Schema Validation**
   - All API input is validated using Zod schemas
   - Strict type checking and constraints on input fields
   - Custom validation functions for complex validation rules

2. **Input Sanitization**
   - User input is sanitized to prevent XSS attacks
   - HTML characters are escaped using the `sanitizeInput` function

### Rate Limiting

1. **IP-Based Rate Limiting**
   - General API rate limiting: 5 requests per minute per IP address
   - Specialized limits for sensitive endpoints (e.g., payment endpoints)

2. **User-Based Rate Limiting**
   - Additional limits based on user ID for authenticated endpoints
   - Payment endpoints limited to 3 requests per minute per user

### CORS Protection

1. **Origin Validation**
   - Strict list of allowed origins
   - Development mode exception for local testing
   - Proper CORS headers for all responses

### Secure HTTP Headers

1. **Content Security Policy (CSP)**
   - Restricts sources of executable scripts
   - Allows specific domains for payment integration (Razorpay)

2. **Other Security Headers**
   - X-Frame-Options: Prevents clickjacking
   - Strict-Transport-Security: Enforces HTTPS
   - X-Content-Type-Options: Prevents MIME type sniffing
   - Permissions-Policy: Restricts browser feature usage
   - Referrer-Policy: Controls referrer information

### Payment Security

1. **Webhook Signature Verification**
   - Razorpay webhook signatures verified cryptographically
   - Raw request body preserved for signature verification

2. **Amount Validation**
   - Checks for minimum and maximum payment amounts
   - Prevents manipulation of payment amounts

3. **Transaction Idempotency**
   - Unique IDs with security hashes for transactions
   - Prevents duplicate processing of payments

### CSRF Protection

1. **CSRF Token Generation and Validation**
   - Tokens generated with cryptographic methods
   - Includes user binding and expiration time
   - Used for state-changing operations

## Security Utilities

The following security utilities are implemented:

1. `addSecurityHeaders(response)`: Adds security headers to HTTP responses
2. `generateCsrfToken(userId)`: Generates a CSRF token for a user
3. `verifyCsrfToken(token, userId)`: Verifies a CSRF token
4. `sanitizeInput(input)`: Sanitizes user input to prevent XSS
5. `createCspNonce()`: Creates a nonce for Content Security Policy
6. `isValidApiKey(apiKey, validKeys)`: Validates API keys using constant-time comparison

## Deployment Considerations

1. **Environment Variables**
   - All secrets must be securely stored in environment variables
   - Different variables for development and production

2. **HTTPS Enforcement**
   - All production API requests must use HTTPS
   - Enforced via Strict-Transport-Security header

3. **Error Handling**
   - Production mode hides detailed error information
   - Prevents information leakage about system internals 