# Environment Variables Guide for Production Deployment

This document provides a comprehensive guide to all environment variables required to successfully deploy the Final Fantasy App to Vercel with an AWS RDS MySQL database.

## Critical Environment Variables

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string for AWS RDS | `mysql://username:password@hostname:3306/dbname` | Yes |
| `NEXTAUTH_URL` | The canonical URL of your website | `https://your-app.vercel.app` | Yes |
| `NEXTAUTH_SECRET` | Secret used to encrypt session cookies | Random 32+ character string | Yes |
| `JWT_SECRET` | Secret used to sign JWT tokens | Random 32+ character string | Yes |
| `ADMIN_KEY` | Secret key for admin access | Random string | Yes |

## Authentication Variables

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `012345678901-abc123def456.apps.googleusercontent.com` | Yes, for Google Auth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-abc123def456` | Yes, for Google Auth |

## Payment Gateway Variables (Razorpay)

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `RAZORPAY_KEY_ID` | Your Razorpay API key ID | `rzp_live_XXXXXXXXXXXXXXX` | Yes, for payments |
| `RAZORPAY_KEY_SECRET` | Your Razorpay API key secret | `XXXXXXXXXXXXXXXXXXXXXXXX` | Yes, for payments |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for verifying Razorpay webhooks | Random string | Yes, for webhooks |
| `BYPASS_RAZORPAY` | Skip actual payment processing (for testing) | `false` | No |

## Email Notification Variables

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `EMAIL_SERVER_HOST` | SMTP server hostname | `smtp.gmail.com` | Yes, for emails |
| `EMAIL_SERVER_PORT` | SMTP server port | `587` | Yes, for emails |
| `EMAIL_SERVER_USER` | SMTP server username/email | `noreply@yourdomain.com` | Yes, for emails |
| `EMAIL_SERVER_PASSWORD` | SMTP server password | Password or app-specific password | Yes, for emails |
| `EMAIL_FROM` | From address for sent emails | `noreply@yourdomain.com` | Yes, for emails |

## Client-Side Variables

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `NEXT_PUBLIC_APP_URL` | Public URL for client-side API calls | `https://your-app.vercel.app` | Yes |

## Application Configuration

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | Yes |

## How to Set Environment Variables in Vercel

1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable with its corresponding value
4. Make sure to assign variables to the correct environments (Production, Preview, Development)
5. Click Save

## Generating Secure Random Secrets

For security-critical values like `NEXTAUTH_SECRET` and `JWT_SECRET`, generate secure random strings:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Testing Your Configuration

After setting up all environment variables, you can validate them by:

1. Running a production build locally:
   ```bash
   npm run build
   ```

2. Checking logs in Vercel dashboard after deployment

## Troubleshooting Common Environment Variable Issues

### Database Connection Issues
- Ensure your `DATABASE_URL` follows the correct format: `mysql://username:password@hostname:3306/dbname`
- Check that special characters in passwords are URL-encoded
- Verify the database user has necessary permissions
- Confirm AWS RDS security groups allow connections from Vercel

### NextAuth Issues
- Ensure `NEXTAUTH_URL` exactly matches your deployment URL, including https:// prefix
- Verify that `NEXTAUTH_SECRET` is set and is sufficiently random
- For Google Auth, confirm OAuth credentials are properly configured for your production domain

### Razorpay Issues
- Test keys start with `rzp_test_`, while production keys start with `rzp_live_`
- Ensure webhook URLs in Razorpay dashboard are updated to your production domain
- Verify `RAZORPAY_WEBHOOK_SECRET` matches what's configured in the Razorpay dashboard 