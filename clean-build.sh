#!/bin/bash

echo "Starting clean build process..."

# Set environment to production
export NODE_ENV=production

# Remove node_modules
echo "Removing node_modules directory..."
rm -rf node_modules
rm -rf .next

# Remove package-lock.json
echo "Removing package-lock.json..."
rm -f package-lock.json

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build with disabled ESLint and TypeScript checks
echo "Building the application..."
NEXT_DISABLE_ESLINT=1 NEXT_DISABLE_TYPE_CHECKING=1 NEXT_TELEMETRY_DISABLED=1 npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    echo "You can now deploy the application."
else
    echo "Build failed. Please check the errors above."
    exit 1
fi 