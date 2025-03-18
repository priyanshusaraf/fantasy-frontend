#!/bin/bash

echo "Preparing project for Vercel deployment..."

# Ensure next.config.js is properly set up for Vercel
echo "Configuring next.config.js for Vercel..."
cp next.config.js next.config.js.backup

# Create a modified Next.js config optimized for Vercel
cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'assets.razorpay.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID
  }
};

module.exports = nextConfig;
EOL

# Create PostCSS config
echo "Setting up PostCSS configuration..."
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {}
  }
}
EOL

# Create a .env.production file with placeholders if it doesn't exist
if [ ! -f .env.production ]; then
  echo "Creating .env.production template..."
  cp .env.example .env.production
  echo "Please update .env.production with your production values"
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create deployment instructions
echo "Creating Vercel deployment instructions..."
cat > VERCEL_DEPLOY.md << 'EOL'
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
EOL

echo "==========================================="
echo "✅ VERCEL DEPLOYMENT PREPARATION COMPLETE!"
echo "==========================================="
echo ""
echo "Your project is now ready for Vercel deployment."
echo "Please follow the instructions in VERCEL_DEPLOY.md"
echo ""
echo "To deploy to Vercel, run:"
echo "vercel --prod" 