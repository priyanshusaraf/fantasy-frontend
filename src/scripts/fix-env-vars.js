/**
 * Fix Environment Variables for NextAuth
 * This script generates commands to fix environment variables on Vercel
 */

console.log('=== VERCEL ENVIRONMENT VARIABLE FIXING COMMANDS ===');
console.log('\n🔧 Run these commands to update your environment variables:\n');

// Update NEXTAUTH_URL to use www
console.log('# 1. Update NEXTAUTH_URL to use www subdomain (to match redirect configuration):');
console.log('vercel env rm NEXTAUTH_URL production -y');
console.log('vercel env add NEXTAUTH_URL https://www.matchup.ltd production');
console.log('');

// Make sure JWT_SECRET and NEXTAUTH_SECRET match
console.log('# 2. Ensure JWT_SECRET and NEXTAUTH_SECRET match:');
console.log('vercel env rm JWT_SECRET production -y');
console.log('vercel env add JWT_SECRET a8c59bb1d44e6fb9b39e1f25e6dd5281 production');
console.log('vercel env rm NEXTAUTH_SECRET production -y');
console.log('vercel env add NEXTAUTH_SECRET a8c59bb1d44e6fb9b39e1f25e6dd5281 production');
console.log('');

// Force a new deployment
console.log('# 3. IMPORTANT: Trigger a new deployment after updating environment variables:');
console.log('vercel --prod');

console.log('\n=== ADDITIONAL INSTRUCTIONS ===');
console.log('1. After deploying, completely clear browser cookies and cache');
console.log('2. Access the site directly at https://www.matchup.ltd/auth');
console.log('3. Try using incognito/private browsing mode');
console.log('4. Wait 5-10 minutes after deployment for changes to fully propagate\n');

// Check for DNS configuration
console.log('🌐 DOMAIN CONFIGURATION:');
console.log('1. Ensure both domains point to the same IP address in your DNS settings');
console.log('2. Set up proper CNAME record for www subdomain');
console.log('3. In Vercel Domains settings, verify that:');
console.log('   - www.matchup.ltd is the primary domain');
console.log('   - matchup.ltd redirects to www.matchup.ltd');

// Check for local environment
console.log('\n💻 LOCAL DEVELOPMENT:');
console.log('Update your local .env file with:');
console.log('NEXTAUTH_URL=https://www.matchup.ltd');
console.log('NEXTAUTH_SECRET=a8c59bb1d44e6fb9b39e1f25e6dd5281');
console.log('JWT_SECRET=a8c59bb1d44e6fb9b39e1f25e6dd5281'); 