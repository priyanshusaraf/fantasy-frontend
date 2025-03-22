/**
 * Check if a deployment is needed
 * This script checks if a new deployment is needed based on changed files
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

function checkDeploymentStatus() {
  console.log('\n🚀 CHECKING DEPLOYMENT STATUS');
  
  // Check if the updated login form has been deployed
  try {
    const loginFormPath = './src/components/auth/LoginForm.tsx';
    const stats = fs.statSync(loginFormPath);
    const lastModified = stats.mtime;
    
    // Current time
    const now = new Date();
    const diffInHours = (now - lastModified) / (1000 * 60 * 60);
    
    console.log(`LoginForm.tsx was last modified: ${lastModified}`);
    console.log(`Hours since last modification: ${diffInHours.toFixed(2)}`);
    
    if (diffInHours < 2) {
      console.log('⚠️ LoginForm.tsx was modified recently. Make sure you have deployed the changes.');
    }
  } catch (error) {
    console.log(`Error checking LoginForm: ${error.message}`);
  }
  
  // Check environment variables
  console.log('\n🌐 CHECKING ENVIRONMENT VARIABLES');
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? `***${process.env.JWT_SECRET.slice(-4)}` : 'not set'}`);
  console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? `***${process.env.NEXTAUTH_SECRET.slice(-4)}` : 'not set'}`);
  
  // Check if secrets match
  if (process.env.JWT_SECRET && process.env.NEXTAUTH_SECRET) {
    if (process.env.JWT_SECRET === process.env.NEXTAUTH_SECRET) {
      console.log('✅ JWT_SECRET and NEXTAUTH_SECRET match');
    } else {
      console.log('❌ JWT_SECRET and NEXTAUTH_SECRET do not match!');
    }
  }
  
  // Check if URL uses www
  if (process.env.NEXTAUTH_URL) {
    if (process.env.NEXTAUTH_URL.includes('www.')) {
      console.log('✅ NEXTAUTH_URL includes www subdomain');
    } else {
      console.log('❌ NEXTAUTH_URL should include www subdomain to match your domain configuration!');
    }
  }
}

function checkGitStatus() {
  console.log('\n📊 CHECKING GIT STATUS');
  
  exec('git status --porcelain', (error, stdout, stderr) => {
    if (error) {
      console.log(`Error checking git status: ${error.message}`);
      return;
    }
    
    if (stdout.trim()) {
      console.log('⚠️ You have uncommitted changes:');
      console.log(stdout);
      console.log('Make sure to commit and push these changes before deploying.');
    } else {
      console.log('✅ No uncommitted changes.');
    }
    
    // Check recent commits
    exec('git log --pretty=format:"%h - %s (%cr)" --date=relative -n 5', (err, out) => {
      if (err) {
        console.log(`Error checking git log: ${err.message}`);
        return;
      }
      
      console.log('\nRecent commits:');
      console.log(out);
      
      // Final recommendations
      provideRecommendations();
    });
  });
}

function provideRecommendations() {
  console.log('\n🔧 RECOMMENDATIONS');
  console.log('1. Run "vercel --prod" to deploy your latest changes');
  console.log('2. After deploying, wait 5-10 minutes for changes to fully propagate');
  console.log('3. Clear browser cookies completely before testing');
  console.log('4. Use an incognito/private window for testing');
  console.log('5. Make sure your env variables match between local and production');
  console.log('6. If issues persist, check the Vercel deployment logs for errors');
}

function main() {
  console.log('🔍 DEPLOYMENT CHECK');
  console.log('==================');
  
  checkDeploymentStatus();
  checkGitStatus();
}

main(); 