#!/bin/bash

echo "Fixing Tailwind CSS configuration..."

# Install the correct Tailwind PostCSS plugin
npm install @tailwindcss/postcss@latest tailwindcss@latest autoprefixer@latest postcss@latest --save-dev

# Remove the .next directory to clear any cached configs
rm -rf .next

# Create the correct PostCSS configuration
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {}
  }
}
EOL

# Create a working tailwind.config.js if it doesn't exist
if [ ! -f tailwind.config.js ]; then
  cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL
fi

# Remove any conflicting PostCSS files
rm -f postcss.config.mjs

# Generate Prisma client
echo "Regenerating Prisma client..."
npx prisma generate

# Run the build with optimized memory settings
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