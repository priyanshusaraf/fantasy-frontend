# Deployment Instructions

This package has been prepared for production deployment.

## To deploy:

1. Install dependencies:
   ```
   npm install
   ```

2. Generate Prisma client:
   ```
   npx prisma generate
   ```

3. Start the production server:
   ```
   npm run start
   ```

## For container deployment:

1. Make sure to set proper environment variables
2. Build using `npm run build`
3. The standalone output will be in `.next/standalone/`

## Environment variables required:

- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- Other authentication providers as needed
