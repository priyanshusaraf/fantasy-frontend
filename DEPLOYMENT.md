# Final Fantasy App Deployment Guide

This guide provides step-by-step instructions for deploying the Final Fantasy App to production securely and efficiently. Our goal is to complete deployment in under 2 hours.

## Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git
- Access to a MySQL database (version 8.0+ recommended)
- Domain name (optional but recommended)
- Vercel account (optional, for Vercel deployment)

## Deployment Options

There are two main deployment paths:

1. **Vercel Deployment**: Fastest and easiest method, recommended for most users
2. **Manual Deployment**: For users who need more control or have specific hosting requirements

## Quick Deployment (Under 2 Hours)

The quickest way to deploy is to use our automated script that handles most steps:

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

The script will guide you through the deployment process interactively.

## Step-by-Step Deployment

If you prefer a manual approach or need to troubleshoot specific steps, follow these instructions:

### 1. Environment Configuration

Create a production environment file:

```bash
# Copy the example env file
cp .env.example .env.production

# Edit the production env file with your values
nano .env.production
```

Required configuration:

- `DATABASE_URL`: Your production database connection string
- `NEXTAUTH_URL`: Your production domain (e.g., https://yourdomain.com)
- `NEXTAUTH_SECRET`: A randomly generated secret for NextAuth
- `JWT_SECRET`: A randomly generated secret for JWT tokens
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: If using Razorpay for payments
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_NAME`: For creating initial admin accounts

### 2. Database Setup

```bash
# Deploy database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 3. Admin Account Setup

IMPORTANT: Never hardcode admin credentials in files. Always use environment variables.

```bash
# Set environment variables for admin creation
export ADMIN_EMAIL="your-email@example.com"
export ADMIN_PASSWORD="your-secure-password"
export ADMIN_USERNAME="your-username"
export ADMIN_NAME="Your Name"

# Run the admin creation script
node -r dotenv/config src/scripts/create-tournament-admin.js
```

Alternatively, you can add these variables to your .env file:

```
ADMIN_EMAIL="your-email@example.com"
ADMIN_PASSWORD="your-secure-password"
ADMIN_USERNAME="your-username"
ADMIN_NAME="Your Name"
```

### 4. Build the Application

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

### 5. Deployment

#### Option 1: Vercel Deployment

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

Follow the prompts to connect your Vercel account and project.

#### Option 2: Manual Deployment

```bash
# Create a deployment package
mkdir -p deployment
cp -r .next deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp .env.production deployment/
cp -r prisma deployment/

# Transfer to your server and run:
npm install --production
npm start
```

## Security Measures Implemented

Our application includes the following security features:

1. **API Security**:
   - JWT authentication for all endpoints
   - Role-based access control
   - Input validation using Zod schemas
   - Rate limiting for API protection
   - CORS protection with origin validation

2. **HTTP Security Headers**:
   - Content Security Policy
   - X-Frame-Options
   - Strict-Transport-Security
   - X-Content-Type-Options
   - Permissions-Policy
   - Referrer-Policy

3. **Payment Security**:
   - Webhook signature verification
   - Amount validation
   - Transaction idempotency with security hashes

4. **General Security**:
   - CSRF protection
   - Input sanitization
   - Secure environment variable handling
   - No hardcoded credentials in source code

## Post-Deployment Tasks

1. **Verify the Application**:
   - Check that the application loads correctly
   - Test user authentication
   - Test critical features like tournament creation, fantasy team management
   - Verify payment processing with a small test payment

2. **Set Up Monitoring**:
   - Configure Vercel Analytics or Google Analytics
   - Set up error monitoring with Sentry or similar service
   - Create database backup schedule

3. **Performance Optimization**:
   - Enable caching where appropriate
   - Configure CDN if needed

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your DATABASE_URL in .env.production
2. Ensure database server allows connections from your app server
3. Check for network issues or firewall rules blocking connections

### Authentication Problems

If users cannot log in:

1. Verify NEXTAUTH_URL is correctly set to your production domain
2. Check Google OAuth credentials are properly configured
3. Confirm JWT_SECRET and NEXTAUTH_SECRET are set

### Payment Integration Issues

If payments aren't working:

1. Verify Razorpay API keys are correct
2. Check webhook URL is correctly configured in Razorpay dashboard
3. Ensure webhook signature verification is working correctly

## Cost Optimization

To minimize deployment costs:

1. **Database**: Use PlanetScale's free tier or Railway's shared instance
2. **Hosting**: Use Vercel's hobby plan (free)
3. **CDN**: Utilize Vercel's built-in Edge Cache
4. **Image Storage**: Use Cloudinary's free tier
5. **Analytics**: Start with free tiers of analytics services

## Scaling Considerations

As your user base grows:

1. Consider implementing Redis for caching and session storage
2. Set up read replicas for database scaling
3. Implement more granular server-side caching
4. Consider serverless functions for specific high-load endpoints

## Support and Questions

If you need assistance during deployment, please:

1. Check the documentation first
2. Search existing GitHub issues
3. Create a new issue if your problem is not already documented

Remember that most deployment issues can be resolved by checking logs and ensuring environment variables are correctly set.

## Security Best Practices

1. **Never hardcode credentials**: Always use environment variables for sensitive information like admin credentials, API keys, etc.
2. **Rotate secrets regularly**: Change your NextAuth secret, JWT secret, and admin passwords periodically
3. **Use strong, unique passwords**: Generate random, complex passwords for all admin accounts
4. **Implement MFA**: Consider adding multi-factor authentication for admin accounts
5. **Audit admin access**: Regularly review who has admin access and remove unnecessary accounts 