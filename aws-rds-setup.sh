#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}    AWS RDS Database Setup for Vercel     ${NC}"
echo -e "${BLUE}===========================================${NC}"

# Check for required tools
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Error: mysql command not found. Please install MySQL client tools.${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx command not found. Please install Node.js.${NC}"
    exit 1
fi

# Get database connection information
echo -e "\n${YELLOW}Please provide your AWS RDS connection details:${NC}"

read -p "RDS Hostname: " DB_HOST
read -p "Database name: " DB_NAME
read -p "Username: " DB_USER
read -sp "Password: " DB_PASS
echo
read -p "Port (default: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

# Create connection string
CONNECTION_STRING="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
export DATABASE_URL="$CONNECTION_STRING"

echo -e "\n${YELLOW}Testing database connection...${NC}"

# Test the connection
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" "$DB_NAME" &> /dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not connect to the database. Please check your credentials and make sure the database exists.${NC}"
    exit 1
fi

echo -e "${GREEN}Database connection successful!${NC}"

# Run migrations
echo -e "\n${YELLOW}Do you want to run Prisma migrations on this database? (y/n)${NC}"
read -p "> " RUN_MIGRATIONS

if [[ $RUN_MIGRATIONS == "y" || $RUN_MIGRATIONS == "Y" ]]; then
    echo -e "\n${YELLOW}Running database migrations...${NC}"
    
    npx prisma migrate deploy
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Migration failed. Check the error message above.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Migrations applied successfully!${NC}"
else
    echo -e "\n${BLUE}Skipping migrations.${NC}"
fi

# Generate Prisma client
echo -e "\n${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to generate Prisma client.${NC}"
    exit 1
fi

echo -e "${GREEN}Prisma client generated successfully!${NC}"

# Create .env.production.local with the connection string
echo -e "\n${YELLOW}Do you want to save the connection string to .env.production.local? (y/n)${NC}"
read -p "> " SAVE_ENV

if [[ $SAVE_ENV == "y" || $SAVE_ENV == "Y" ]]; then
    # Backup existing file if it exists
    if [ -f .env.production.local ]; then
        cp .env.production.local .env.production.local.backup
        echo -e "${BLUE}Backed up existing .env.production.local to .env.production.local.backup${NC}"
    fi
    
    # Create or update the file
    if [ -f .env.production.local ]; then
        # Update existing file
        grep -v "^DATABASE_URL=" .env.production.local > .env.production.local.tmp
        echo "DATABASE_URL=\"$CONNECTION_STRING\"" >> .env.production.local.tmp
        mv .env.production.local.tmp .env.production.local
    else
        # Create new file
        echo "DATABASE_URL=\"$CONNECTION_STRING\"" > .env.production.local
    fi
    
    echo -e "${GREEN}Connection string saved to .env.production.local${NC}"
fi

# Print instructions for Vercel
echo -e "\n${BLUE}===========================================${NC}"
echo -e "${GREEN}Database setup complete!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "\n${YELLOW}To use this database with Vercel, add the following environment variable:${NC}"
echo -e "DATABASE_URL: ${GREEN}$CONNECTION_STRING${NC}"
echo -e "\n${YELLOW}Make sure your AWS RDS security group allows connections from Vercel IP ranges.${NC}"
echo -e "${YELLOW}You can find Vercel IP ranges at: https://vercel.com/docs/concepts/functions/serverless-functions/regions#serverless-function-regions${NC}"

echo -e "\n${BLUE}===========================================${NC}"
echo -e "${BLUE}            Setup Complete!               ${NC}"
echo -e "${BLUE}===========================================${NC}" 