#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   Final Fantasy App Vercel Deployment    ${NC}"
echo -e "${BLUE}===========================================${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Vercel CLI. Please install it manually:${NC}"
        echo -e "${YELLOW}npm install -g vercel${NC}"
        exit 1
    fi
fi

# Check for important files
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Are you in the project root directory?${NC}"
    exit 1
fi

if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}Error: prisma/schema.prisma not found. Prisma configuration is required.${NC}"
    exit 1
fi

# Prepare the project
echo -e "\n${YELLOW}Preparing project for deployment...${NC}"

# Fix next.config.js if needed
if grep -q "output.*standalone" next.config.js; then
    echo -e "${GREEN}✓ next.config.js already has 'output: standalone' configuration${NC}"
else
    echo -e "${YELLOW}Updating next.config.js to include 'output: standalone'...${NC}"
    cp next.config.js next.config.js.bak
    
    # Use next.config.js.backup if it exists and has the proper configuration
    if [ -f "next.config.js.backup" ] && grep -q "output.*standalone" next.config.js.backup; then
        cp next.config.js.backup next.config.js
        echo -e "${GREEN}✓ Restored optimized next.config.js from backup${NC}"
    else
        echo -e "${RED}Could not find optimized next.config.js. Please ensure it includes 'output: standalone'.${NC}"
        echo -e "${YELLOW}You may need to modify next.config.js manually.${NC}"
    fi
fi

# Run vercel-deploy.sh if it exists
if [ -f "vercel-deploy.sh" ]; then
    echo -e "\n${YELLOW}Running vercel-deploy.sh script...${NC}"
    chmod +x vercel-deploy.sh
    ./vercel-deploy.sh
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}vercel-deploy.sh script failed. Please check the errors above.${NC}"
        exit 1
    fi
fi

# Check for .env.production
if [ ! -f ".env.production" ]; then
    echo -e "\n${YELLOW}Creating .env.production file from .env.example...${NC}"
    
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        echo -e "${GREEN}✓ Created .env.production from .env.example${NC}"
        echo -e "${YELLOW}Please update .env.production with your production values before continuing.${NC}"
        read -p "Press Enter when you've updated .env.production..."
    else
        echo -e "${RED}Error: .env.example not found. Please create a .env.production file manually.${NC}"
        exit 1
    fi
fi

# Authenticate with Vercel if needed
echo -e "\n${YELLOW}Checking Vercel authentication...${NC}"
vercel whoami &> /dev/null

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Please log in to Vercel:${NC}"
    vercel login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to log in to Vercel. Please try again.${NC}"
        exit 1
    fi
fi

# Generate secure secrets if needed
echo -e "\n${YELLOW}Do you need to generate secure secrets for NEXTAUTH_SECRET and JWT_SECRET? (y/n)${NC}"
read -p "> " GENERATE_SECRETS

if [[ $GENERATE_SECRETS == "y" || $GENERATE_SECRETS == "Y" ]]; then
    echo -e "\n${YELLOW}Generating secure random secrets...${NC}"
    
    NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    echo -e "\n${GREEN}Generated secrets:${NC}"
    echo -e "NEXTAUTH_SECRET=${BLUE}${NEXTAUTH_SECRET}${NC}"
    echo -e "JWT_SECRET=${BLUE}${JWT_SECRET}${NC}"
    
    echo -e "\n${YELLOW}Do you want to add these to .env.production? (y/n)${NC}"
    read -p "> " ADD_TO_ENV
    
    if [[ $ADD_TO_ENV == "y" || $ADD_TO_ENV == "Y" ]]; then
        # Backup existing file
        cp .env.production .env.production.backup
        
        # Update or add the secrets
        grep -v "^NEXTAUTH_SECRET=" .env.production > .env.production.tmp
        echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"" >> .env.production.tmp
        
        grep -v "^JWT_SECRET=" .env.production.tmp > .env.production.tmp2
        echo "JWT_SECRET=\"$JWT_SECRET\"" >> .env.production.tmp2
        
        mv .env.production.tmp2 .env.production
        rm -f .env.production.tmp
        
        echo -e "${GREEN}✓ Added secrets to .env.production${NC}"
    fi
fi

# Check for AWS Database setup
echo -e "\n${YELLOW}Have you already set up your AWS RDS MySQL database? (y/n)${NC}"
read -p "> " AWS_DB_SETUP

if [[ $AWS_DB_SETUP != "y" && $AWS_DB_SETUP != "Y" ]]; then
    echo -e "\n${YELLOW}You need to set up an AWS RDS MySQL database before proceeding.${NC}"
    
    if [ -f "aws-rds-setup.sh" ]; then
        echo -e "${YELLOW}Run the aws-rds-setup.sh script to set up your database:${NC}"
        echo -e "${BLUE}./aws-rds-setup.sh${NC}"
    else
        echo -e "${YELLOW}Please follow the AWS RDS setup instructions in the VERCEL_DEPLOYMENT_CHECKLIST.md file.${NC}"
    fi
    
    exit 1
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies. Please fix the errors and try again.${NC}"
    exit 1
fi

# Generate Prisma client
echo -e "\n${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate Prisma client. Please fix the errors and try again.${NC}"
    exit 1
fi

# Build the application
echo -e "\n${YELLOW}Building the application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix the errors and try again.${NC}"
    exit 1
fi

echo -e "\n${GREEN}Build completed successfully!${NC}"

# Deploy to Vercel
echo -e "\n${YELLOW}Do you want to deploy to Vercel now? (y/n)${NC}"
read -p "> " DEPLOY_NOW

if [[ $DEPLOY_NOW == "y" || $DEPLOY_NOW == "Y" ]]; then
    echo -e "\n${YELLOW}Deploying to Vercel...${NC}"
    vercel --prod
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Deployment failed. Please check the errors above.${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}Deployment successful!${NC}"
    echo -e "${YELLOW}Please verify your deployment and check that all features are working correctly.${NC}"
else
    echo -e "\n${BLUE}Skipping deployment. Run 'vercel --prod' when you're ready to deploy.${NC}"
fi

echo -e "\n${BLUE}===========================================${NC}"
echo -e "${BLUE}         Deployment Process Complete       ${NC}"
echo -e "${BLUE}===========================================${NC}"

if [[ $DEPLOY_NOW == "y" || $DEPLOY_NOW == "Y" ]]; then
    echo -e "\n${YELLOW}Post-Deployment Checklist:${NC}"
    echo -e "1. Verify your application is accessible"
    echo -e "2. Test authentication (login/signup)"
    echo -e "3. Test Razorpay payment integration"
    echo -e "4. Configure Razorpay webhooks to point to your production URL"
    echo -e "5. Verify email notifications are working"
    echo -e "6. Test fantasy team creation and tournament management"
fi 