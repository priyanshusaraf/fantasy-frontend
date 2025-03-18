#!/bin/bash

echo "Starting production build fix..."

# Force install autoprefixer with exact path resolution
echo "Reinstalling critical dependencies..."
npm install autoprefixer@latest postcss@latest tailwindcss@latest --save-exact

# Remove any conflicting postcss config files
echo "Cleaning up conflicting PostCSS config files..."
rm -f postcss.config.mjs

# Create correct PostCSS config
echo "Creating standard PostCSS config..."
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
EOL

# Regenerate Prisma client
echo "Regenerating Prisma client..."
npx prisma generate

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Run the build with environmental fixes
echo "Building the application..."
NODE_OPTIONS="--max-old-space-size=4096" NEXT_TELEMETRY_DISABLED=1 npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    echo "Your application is ready for deployment."
else
    echo "Build failed. Please check the errors above."
    exit 1
fi 