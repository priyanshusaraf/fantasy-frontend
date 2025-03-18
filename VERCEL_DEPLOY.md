# Vercel Deployment Instructions

This project is configured for deployment on Vercel.

## To deploy to Vercel:

1. Make sure you have the Vercel CLI installed:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy to Vercel:
   ```
   vercel --prod
   ```

## Required Environment Variables for Vercel:

Add these environment variables in the Vercel dashboard:

- DATABASE_URL
- NEXTAUTH_URL (set to your production domain)
- NEXTAUTH_SECRET
- JWT_SECRET
- GOOGLE_CLIENT_ID (if using Google OAuth)
- GOOGLE_CLIENT_SECRET (if using Google OAuth)
- RAZORPAY_KEY_ID (if using Razorpay)
- RAZORPAY_KEY_SECRET (if using Razorpay)
- RAZORPAY_WEBHOOK_SECRET (if using Razorpay webhooks)
- ADMIN_KEY

## Database Deployment:

Before deploying, make sure your database is set up:

1. Run migrations on your production database:
   ```
   npx prisma migrate deploy
   ```

2. The Prisma client will be automatically generated during the build process on Vercel.
