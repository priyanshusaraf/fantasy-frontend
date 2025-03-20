# Final Fantasy App Vercel Deployment Checklist

This checklist covers all the steps required to successfully deploy the Final Fantasy App to Vercel with an AWS RDS MySQL database.

## Pre-Deployment Preparation

- [ ] **Database Setup (AWS RDS)**
  - [ ] Create MySQL 8.0+ instance in AWS RDS
  - [ ] Configure security groups to allow connections from Vercel
  - [ ] Create database user with appropriate permissions
  - [ ] Note down connection details (host, username, password, database name)
  - [ ] Create connection string in format: `mysql://username:password@host:3306/dbname`

- [ ] **Environment Variables**
  - [ ] Create a `.env.production.local` file with all required variables
  - [ ] Update `NEXTAUTH_URL` with your Vercel app URL
  - [ ] Update `DATABASE_URL` with your AWS RDS connection string
  - [ ] Generate strong secrets for `NEXTAUTH_SECRET` and `JWT_SECRET`
  - [ ] Configure Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`)
  - [ ] Configure Google OAuth credentials for production
  - [ ] Set `NODE_ENV=production`

- [ ] **Code Preparation**
  - [ ] Ensure all database migrations are committed
  - [ ] Update `allowedOrigins` in middleware.ts with your production domain
  - [ ] Verify Razorpay webhook handlers are properly configured
  - [ ] Ensure next.config.js is optimized for production (includes output: 'standalone')
  - [ ] Update image domains configuration if needed

## Deployment Process

- [ ] **Database Migration**
  - [ ] Apply database migrations to AWS RDS:
    ```bash
    export DATABASE_URL="mysql://username:password@host:3306/dbname"
    npx prisma migrate deploy
    ```

- [ ] **Vercel Setup**
  - [ ] Install Vercel CLI: `npm install -g vercel`
  - [ ] Login to Vercel: `vercel login`
  - [ ] Configure Vercel project:
    ```bash
    vercel
    ```
  - [ ] Link to existing project or create new one
  - [ ] Choose your team/account
  - [ ] Set your production branch (main/master)

- [ ] **Environment Variable Setup in Vercel**
  - [ ] Add all environment variables from `.env.production.local` to Vercel project dashboard
  - [ ] Double-check sensitive values (`DATABASE_URL`, `NEXTAUTH_SECRET`, `JWT_SECRET`, Razorpay keys)
  - [ ] Set `NEXTAUTH_URL` to match your Vercel deployment URL

- [ ] **Production Deployment**
  - [ ] Deploy to production: `vercel --prod`
  - [ ] Wait for build and deployment to complete
  - [ ] Verify deployment URL is accessible

## Post-Deployment Verification

- [ ] **Functionality Check**
  - [ ] Test user registration and login
  - [ ] Verify Google OAuth integration works
  - [ ] Test tournament creation and management
  - [ ] Test fantasy team creation
  - [ ] Verify payment flow with Razorpay (test payment)
  - [ ] Check that webhooks are properly configured (using Razorpay dashboard)

- [ ] **Performance and Security**
  - [ ] Run Lighthouse audit on key pages
  - [ ] Check that security headers are properly set
  - [ ] Verify API endpoints have proper authentication
  - [ ] Check for any console errors in browser

- [ ] **Monitoring Setup**
  - [ ] Set up error monitoring (Sentry or similar)
  - [ ] Configure performance monitoring
  - [ ] Set up database monitoring in AWS
  - [ ] Configure alerts for critical errors

## Razorpay Production Configuration

- [ ] **Razorpay Dashboard Setup**
  - [ ] Switch from test mode to live mode
  - [ ] Update webhook URLs to your production domain
  - [ ] Test webhooks using Razorpay dashboard
  - [ ] Configure proper error notifications

## Final Checklist

- [ ] Database connection is stable and working
- [ ] Authentication flows work correctly
- [ ] Payment processing is successful
- [ ] Webhooks are received and processed correctly
- [ ] Static assets are loading properly
- [ ] API endpoints are protected and working correctly

## Troubleshooting Common Issues

### Database Connection Issues
- Check that your AWS RDS instance allows connections from Vercel IP ranges
- Verify that DATABASE_URL is correctly formatted
- Ensure the database user has proper permissions
- Check for network issues or firewall rules blocking connections

### Authentication Problems
- Verify NEXTAUTH_URL is correctly set to your production domain
- Check Google OAuth credentials are properly configured
- Confirm JWT_SECRET and NEXTAUTH_SECRET are set

### Payment Integration Issues
- Verify Razorpay API keys are correct
- Check webhook URL is correctly configured in Razorpay dashboard
- Ensure webhook signature verification is working correctly
- Test with a small payment to verify the flow

### Deployment Failures
- Check Vercel build logs for errors
- Verify that all dependencies are correctly installed
- Check for TypeScript/ESLint errors that might be failing the build
- Ensure Prisma generate is running correctly

If you encounter persistent issues, check the Vercel deployment logs and the application logs for detailed error messages. 