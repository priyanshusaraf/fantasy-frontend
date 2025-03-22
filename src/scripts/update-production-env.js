/**
 * Script to help update environment variables in production
 * This script generates commands that can be run to update environment variables
 */

console.log('===== VERCEL ENVIRONMENT VARIABLE COMMANDS =====');
console.log('Run these commands to update your environment variables on Vercel:');
console.log('');
console.log('# Update JWT_SECRET to match NEXTAUTH_SECRET:');
console.log('vercel env add JWT_SECRET a8c59bb1d44e6fb9b39e1f25e6dd5281 --scope production');
console.log('');
console.log('# Verify both values match:');
console.log('vercel env ls');
console.log('');
console.log('# After updating environment variables, redeploy your application:');
console.log('vercel --prod');
console.log('');
console.log('===== MANUAL UPDATES =====');
console.log('If you\'re not using Vercel, update these environment variables in your hosting platform:');
console.log('');
console.log('JWT_SECRET=a8c59bb1d44e6fb9b39e1f25e6dd5281');
console.log('NEXTAUTH_SECRET=a8c59bb1d44e6fb9b39e1f25e6dd5281');
console.log('');
console.log('===== AFTER UPDATING =====');
console.log('1. Clear all browser cookies and cache');
console.log('2. Try logging in with incognito/private browsing mode');
console.log('3. Check for any errors in the browser console during login'); 