/**
 * Direct API Login Tester
 * Tests login directly through the API without the form
 */

const axios = require('axios');
const dotenv = require('dotenv');
const readline = require('readline');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to prompt for input
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Attempt API login
async function testLoginAPI(baseUrl, username, password) {
  console.log(`\n🔑 TESTING LOGIN API: ${baseUrl}/api/auth/login`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${password ? '********' : 'not provided'}`);
  
  try {
    const response = await axios.post(`${baseUrl}/api/auth/login`, {
      usernameOrEmail: username,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API LOGIN SUCCESS');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('\n🔍 DECODING JWT TOKEN');
      try {
        const decoded = jwt.decode(response.data.token);
        console.log('Token decoded successfully:');
        console.log(JSON.stringify(decoded, null, 2));
        
        // Verify with the secret
        try {
          const verified = jwt.verify(response.data.token, process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET);
          console.log('\n✅ Token verified successfully with JWT_SECRET or NEXTAUTH_SECRET');
        } catch (verifyError) {
          console.log('\n❌ Token verification failed with JWT_SECRET or NEXTAUTH_SECRET');
          console.log('Error:', verifyError.message);
        }
      } catch (decodeError) {
        console.log('Error decoding token:', decodeError.message);
      }
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ API LOGIN FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.error || error.message);
    console.log('Full response:', error.response?.data);
    
    return null;
  }
}

// Test NextAuth login
async function testNextAuthLogin(baseUrl, username, password) {
  console.log(`\n🔒 TESTING NEXTAUTH LOGIN: ${baseUrl}/api/auth/callback/credentials`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${password ? '********' : 'not provided'}`);
  
  try {
    // First, need to get the CSRF token
    const csrfResponse = await axios.get(`${baseUrl}/api/auth/csrf`);
    const csrfToken = csrfResponse.data.csrfToken;
    
    console.log(`CSRF Token: ${csrfToken}`);
    
    // Now attempt the login
    const response = await axios.post(`${baseUrl}/api/auth/callback/credentials`, {
      csrfToken,
      usernameOrEmail: username,
      password: password,
      redirect: false,
      callbackUrl: `${baseUrl}/dashboard`,
      json: true
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ NEXTAUTH LOGIN SUCCESS');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ NEXTAUTH LOGIN FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.error || error.message);
    console.log('Full response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 This is similar to the CredentialsSignin error you\'re seeing in the browser!');
    }
    
    return null;
  }
}

// Check environment variables
function checkEnvironment() {
  console.log('\n🌐 ENVIRONMENT VARIABLES');
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'set' : 'not set'}`);
  console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'set' : 'not set'}`);
  
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
    console.log('\n⚠️ ENVIRONMENT ISSUES:');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('\n✅ Environment variables look good');
  }
  
  return issues.length === 0;
}

async function main() {
  console.log('🔍 DIRECT LOGIN TESTER');
  console.log('======================');
  
  const envGood = checkEnvironment();
  if (!envGood) {
    console.log('\n⚠️ Environment issues detected. Results may not be accurate.');
  }
  
  let baseUrl = process.env.NEXTAUTH_URL || 'https://www.matchup.ltd';
  let username = 'sarafpriyanshu09@gmail.com';
  let password = 'matchupsports';
  
  if (process.argv.includes('--prompt')) {
    baseUrl = await prompt(`Enter base URL [${baseUrl}]: `) || baseUrl;
    username = await prompt(`Enter username [${username}]: `) || username;
    password = await prompt('Enter password: ') || password;
  }
  
  // Fix URL if needed
  if (!baseUrl.startsWith('http')) {
    baseUrl = 'https://' + baseUrl;
  }
  
  // Test direct API login
  await testLoginAPI(baseUrl, username, password);
  
  // Test NextAuth login
  await testNextAuthLogin(baseUrl, username, password);
  
  console.log('\n📋 RECOMMENDATIONS:');
  console.log('1. If API login works but NextAuth fails, check that JWT_SECRET and NEXTAUTH_SECRET match');
  console.log('2. Make sure NEXTAUTH_URL matches your actual domain with www');
  console.log('3. Ensure the LoginForm.tsx calls signIn with "usernameOrEmail" (not "email")');
  console.log('4. Clear all browser cookies and try in an incognito window');
  console.log('5. If both tests fail, confirm your credentials are correct');
  
  rl.close();
}

// Entry point
main().catch(error => {
  console.error('Unhandled error:', error);
  rl.close();
}); 