#!/usr/bin/env node
/**
 * Database deployment script
 * 
 * This script handles database migrations during deployment.
 * Usage: node deploy-db.js [--reset]
 * 
 * Options:
 *   --reset   Resets the database (drops and recreates)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get arguments
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');

// Configure colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Execute a command and log the output
 */
function execCommand(command, options = {}) {
  console.log(`${colors.blue}> ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf-8',
      ...options 
    });
    
    if (output) {
      console.log(output);
    }
    
    return { success: true, output };
  } catch (error) {
    console.error(`${colors.red}Error executing command:${colors.reset}`);
    console.error(error.message);
    
    if (error.stdout) {
      console.log(`${colors.yellow}Command output:${colors.reset}`);
      console.log(error.stdout.toString());
    }
    
    if (error.stderr) {
      console.log(`${colors.red}Command error output:${colors.reset}`);
      console.log(error.stderr.toString());
    }
    
    return { success: false, error };
  }
}

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log(`\n${colors.cyan}=== Database Deployment Script ===${colors.reset}`);
  console.log(`${colors.cyan}Mode: ${shouldReset ? 'Reset and migrate' : 'Migrate only'}${colors.reset}\n`);
  
  try {
    // Validate that we have the DATABASE_URL environment variable
    if (!process.env.DATABASE_URL) {
      console.error(`${colors.red}Error: DATABASE_URL environment variable is not set${colors.reset}`);
      process.exit(1);
    }
    
    // If reset is requested, drop the database
    if (shouldReset) {
      console.log(`\n${colors.yellow}Warning: Resetting the database will delete all data!${colors.reset}`);
      console.log(`${colors.yellow}Press Ctrl+C within 5 seconds to cancel...${colors.reset}`);
      
      // Wait 5 seconds to allow cancellation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`\n${colors.yellow}=== Resetting database ===${colors.reset}`);
      
      // Reset the database (drop and recreate)
      const resetResult = execCommand('npx prisma migrate reset --force');
      
      if (!resetResult.success) {
        console.error(`${colors.red}Failed to reset the database${colors.reset}`);
        process.exit(1);
      }
    } else {
      // Run migrations only
      console.log(`\n${colors.green}=== Running database migrations ===${colors.reset}`);
      
      const deployResult = execCommand('npx prisma migrate deploy');
      
      if (!deployResult.success) {
        console.error(`${colors.red}Failed to deploy migrations${colors.reset}`);
        process.exit(1);
      }
    }
    
    // Generate Prisma client
    console.log(`\n${colors.green}=== Generating Prisma client ===${colors.reset}`);
    
    const generateResult = execCommand('npx prisma generate');
    
    if (!generateResult.success) {
      console.error(`${colors.red}Failed to generate Prisma client${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`\n${colors.green}=== Database deployment completed successfully ===${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run migrations
runMigrations(); 