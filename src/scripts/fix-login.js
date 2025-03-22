/**
 * Login Fix Script
 * This script helps identify and fix login issues
 */

const dotenv = require('dotenv');
const { execSync } = require('child_process');
const fs = require('fs');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

function generateVercelCommands() {
  console.log('\n📝 GENERATING VERCEL COMMANDS');
  console.log('Run these commands to fix your environment variables:');
  
  console.log('\n# Remove existing environment variables');
  console.log('vercel env rm NEXTAUTH_URL production -y');
  console.log('vercel env rm JWT_SECRET production -y');
  console.log('vercel env rm NEXTAUTH_SECRET production -y');
  
  console.log('\n# Add corrected environment variables');
  console.log('vercel env add NEXTAUTH_URL production');
  console.log('# When prompted, enter: https://www.matchup.ltd');
  
  // Generate a strong secret if needed
  const suggestedSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'generate-a-new-strong-secret';
  
  console.log('\nvercel env add JWT_SECRET production');
  console.log(`# When prompted, enter: ${suggestedSecret}`);
  
  console.log('\nvercel env add NEXTAUTH_SECRET production');
  console.log(`# When prompted, enter: ${suggestedSecret}`);
  
  console.log('\n# Deploy with the new environment variables');
  console.log('vercel --prod');
  
  console.log('\n⚠️ IMPORTANT NOTES:');
  console.log('1. After deployment, wait 5-10 minutes for changes to propagate');
  console.log('2. Clear browser cookies and cache completely');
  console.log('3. Try logging in using incognito/private window');
  console.log('4. The NEXTAUTH_URL must include www if that\'s where your site is hosted');
  console.log('5. JWT_SECRET and NEXTAUTH_SECRET must match exactly');
}

function checkLoginFormCode() {
  console.log('\n🔍 CHECKING LOGIN FORM CODE');
  
  try {
    const loginFormPath = './src/components/auth/LoginForm.tsx';
    const loginFormCode = fs.readFileSync(loginFormPath, 'utf8');
    
    // Check what field names are used for signIn
    const signInMatch = loginFormCode.match(/signIn\([^)]*\)/g);
    if (signInMatch) {
      console.log('SignIn call found:');
      signInMatch.forEach(match => {
        console.log(`  ${match}`);
      });
      
      // Check if using usernameOrEmail or email
      const usesUsernameOrEmail = loginFormCode.includes('usernameOrEmail:');
      const usesEmail = loginFormCode.includes('email:');
      
      console.log(`Uses usernameOrEmail: ${usesUsernameOrEmail ? '✅ Yes' : '❌ No'}`);
      console.log(`Uses email: ${usesEmail ? '✅ Yes (WRONG FIELD NAME)' : '✅ No (CORRECT)'}`);
      
      if (usesEmail) {
        console.log('\n⚠️ The LoginForm is using "email" but the backend expects "usernameOrEmail"');
        console.log('This mismatch is likely causing your authentication issues');
        
        // Suggest fix
        console.log('\nFix for LoginForm.tsx:');
        console.log('Change:\n  email: username,\nTo:\n  usernameOrEmail: username,');
      }
    } else {
      console.log('⚠️ No signIn call found in LoginForm');
    }
  } catch (error) {
    console.log(`Error reading LoginForm: ${error.message}`);
  }
}

function fixLoginForm() {
  console.log('\n🛠️ ATTEMPTING TO FIX LOGIN FORM');
  
  try {
    const loginFormPath = './src/components/auth/LoginForm.tsx';
    let loginFormCode = fs.readFileSync(loginFormPath, 'utf8');
    
    // Check if using email instead of usernameOrEmail
    if (loginFormCode.includes('email: username,') && !loginFormCode.includes('usernameOrEmail: username,')) {
      console.log('Found "email: username," in the code. Replacing with "usernameOrEmail: username,"');
      
      // Make the replacement
      const updatedCode = loginFormCode.replace(
        'email: username,', 
        'usernameOrEmail: username, // Changed from email to match backend expectations'
      );
      
      // Write the modified file
      fs.writeFileSync(loginFormPath, updatedCode, 'utf8');
      console.log('✅ Successfully updated LoginForm.tsx');
      console.log('Remember to commit and deploy these changes!');
    } else if (loginFormCode.includes('usernameOrEmail: username,')) {
      console.log('✅ LoginForm already uses the correct field name (usernameOrEmail)');
    } else {
      console.log('⚠️ Could not find the expected pattern in LoginForm.tsx');
      console.log('Manual inspection needed');
    }
  } catch (error) {
    console.log(`Error fixing LoginForm: ${error.message}`);
  }
}

function suggestNextSteps() {
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run the Vercel commands above to fix your environment variables');
  console.log('2. Deploy your app using "vercel --prod"');
  console.log('3. Clear browser cookies completely');
  console.log('4. Try logging in at https://www.matchup.ltd/auth in an incognito window');
  console.log('5. If issues persist, contact support with these error logs');
}

function main() {
  console.log('🔧 LOGIN FIX SCRIPT');
  console.log('==================');
  
  // Check environment variables
  console.log('\n🌐 ENVIRONMENT VARIABLES');
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? `***${process.env.JWT_SECRET.slice(-4)}` : 'not set'}`);
  console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? `***${process.env.NEXTAUTH_SECRET.slice(-4)}` : 'not set'}`);
  
  // Check for issues
  const issues = [];
  
  if (!process.env.NEXTAUTH_URL) {
    issues.push('- NEXTAUTH_URL is not set');
  } else if (!process.env.NEXTAUTH_URL.includes('www.')) {
    issues.push('- NEXTAUTH_URL should include www subdomain');
  }
  
  if (!process.env.JWT_SECRET) {
    issues.push('- JWT_SECRET is not set');
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    issues.push('- NEXTAUTH_SECRET is not set');
  } else if (process.env.JWT_SECRET && process.env.JWT_SECRET !== process.env.NEXTAUTH_SECRET) {
    issues.push('- JWT_SECRET and NEXTAUTH_SECRET do not match');
  }
  
  if (issues.length > 0) {
    console.log('\n⚠️ ISSUES DETECTED:');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('\n✅ Environment variables look good');
  }
  
  // Check login form code
  checkLoginFormCode();
  
  // Fix login form if needed
  if (process.argv.includes('--fix-form')) {
    fixLoginForm();
  }
  
  // Generate Vercel commands
  generateVercelCommands();
  
  // Suggest next steps
  suggestNextSteps();
}

// Run the main function
main(); 