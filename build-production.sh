#!/bin/bash

echo "Starting production build..."

# Set environment to production
export NODE_ENV=production

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run the build with linting and type checking disabled
echo "Building the application..."
NEXT_DISABLE_ESLINT=1 NEXT_DISABLE_TYPE_CHECKING=1 npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully."
    echo "You can now deploy the application."
else
    echo "Build failed. Please check the errors above."
    exit 1
fi 