#!/bin/bash
# Final Fantasy App Deployment Script
# This script automates the deployment process to complete in under 2 hours

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Print banner
echo -e "${PURPLE}"
echo "=================================="
echo "    FINAL FANTASY APP DEPLOYER    "
echo "=================================="
echo -e "${NC}"

# Check for required tools
echo -e "${BLUE}Checking prerequisites...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo -e "${RED}git is required but not installed. Aborting.${NC}" >&2; exit 1; }

# Check if we're deploying to Vercel or another platform
read -p "Are you deploying to Vercel? (y/n): " use_vercel
echo ""

# If using Vercel, check for Vercel CLI
if [[ $use_vercel =~ ^[Yy]$ ]]; then
  command -v vercel >/dev/null 2>&1 || {
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
  }
fi

# Step 1: Install dependencies
echo -e "${BLUE}Step 1: Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install dependencies.${NC}"
  exit 1
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}"
echo ""

# Step 2: Environment preparation
echo -e "${BLUE}Step 2: Setting up environment variables...${NC}"
echo -e "${YELLOW}NOTE: You need to have the following information ready:${NC}"
echo "  - Production database connection string"
echo "  - Google OAuth credentials (if using Google authentication)"
echo "  - Razorpay API keys (if using Razorpay)"
echo ""

# Check if .env.production exists, create if not
if [ ! -f .env.production ]; then
  echo -e "${YELLOW}Creating .env.production file...${NC}"
  cp .env.example .env.production
  echo -e "${YELLOW}Please edit .env.production to set your production values.${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open .env.production
  else
    echo "Please edit .env.production manually before continuing."
  fi
  
  read -p "Press Enter when you've updated the .env.production file..."
else
  echo -e "${GREEN}.env.production already exists.${NC}"
fi
echo ""

# Step 3: Database migrations
echo -e "${BLUE}Step 3: Database setup...${NC}"
read -p "Do you want to run database migrations? (y/n): " run_migrations
if [[ $run_migrations =~ ^[Yy]$ ]]; then
  read -p "Reset database (WARNING: This will delete all data)? (y/n): " reset_db
  
  if [[ $reset_db =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Resetting database and running migrations...${NC}"
    node src/scripts/deploy-db.js --reset
  else
    echo -e "${GREEN}Running migrations only...${NC}"
    node src/scripts/deploy-db.js
  fi
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Database migration failed.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}Skipping database migrations.${NC}"
fi
echo ""

# Step 4: Build the application
echo -e "${BLUE}Step 4: Building the application...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Build completed successfully.${NC}"
echo ""

# Step 5: Run tests (optional)
echo -e "${BLUE}Step 5: Running tests (optional)...${NC}"
read -p "Do you want to run tests? (y/n): " run_tests
if [[ $run_tests =~ ^[Yy]$ ]]; then
  npm test
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Some tests failed. Continue anyway? (y/n): ${NC}"
    read continue_anyway
    if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
      echo -e "${RED}Deployment aborted.${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}All tests passed.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping tests.${NC}"
fi
echo ""

# Step 6: Deploy
echo -e "${BLUE}Step 6: Deploying the application...${NC}"
if [[ $use_vercel =~ ^[Yy]$ ]]; then
  echo -e "${GREEN}Deploying to Vercel...${NC}"
  vercel --prod
  if [ $? -ne 0 ]; then
    echo -e "${RED}Vercel deployment failed.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}Manual deployment instructions:${NC}"
  echo "1. Copy the '.next' directory, 'package.json', 'package-lock.json', and '.env.production'"
  echo "2. Transfer these files to your production server"
  echo "3. Run 'npm install --production' on your server"
  echo "4. Start the application with 'npm start'"
  
  # Create a deployment package
  echo -e "${GREEN}Creating deployment package...${NC}"
  mkdir -p deployment
  cp -r .next deployment/
  cp package.json deployment/
  cp package-lock.json deployment/
  cp .env.production deployment/
  cp -r prisma deployment/
  
  # Create a README file for manual deployment
  cat > deployment/README.md << EOL
# Final Fantasy App Deployment

This package contains a pre-built version of the Final Fantasy App.

## Deployment Steps

1. Unpack this directory on your production server
2. Install production dependencies: \`npm install --production\`
3. Deploy database migrations: \`npx prisma migrate deploy\`
4. Start the application: \`npm start\`

## Environment Variables

Make sure to review the \`.env.production\` file and update any values as needed for your environment.
EOL

  echo -e "${GREEN}Deployment package created in the 'deployment' directory.${NC}"
fi
echo ""

# Step 7: Post-deployment tasks
echo -e "${BLUE}Step 7: Post-deployment tasks...${NC}"
echo -e "${YELLOW}Remember to:${NC}"
echo "1. Verify your application is running correctly"
echo "2. Set up a monitoring solution (e.g., Vercel Analytics, Google Analytics)"
echo "3. Configure backup schedules for your database"
echo "4. Test the payment system in production with a small amount"
echo ""

echo -e "${GREEN}Deployment process completed!${NC}"
echo -e "${PURPLE}=======================================${NC}"
echo -e "${GREEN}Thank you for using Final Fantasy App Deployer${NC}"
echo -e "${PURPLE}=======================================${NC}" 