/**
 * Browser Compatibility Checker for NextAuth.js Login
 * Run this file in a browser console to diagnose login issues
 */

(function() {
  console.log('🔍 BROWSER COMPATIBILITY CHECK');
  console.log('==============================');

  // Check browser features
  const features = {
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    cookies: navigator.cookieEnabled,
    secureContext: window.isSecureContext,
    https: window.location.protocol === 'https:',
    thirdPartyCookies: true // we'll test this below
  };

  console.log('📊 BROWSER FEATURES:');
  Object.entries(features).forEach(([feature, supported]) => {
    console.log(`${feature}: ${supported ? '✅' : '❌'}`);
  });

  // Check for cookie blocking
  console.log('\n🍪 COOKIE STATUS:');
  try {
    document.cookie = "testcookie=1; path=/";
    const hasCookie = document.cookie.indexOf("testcookie=") !== -1;
    console.log(`Can set cookies: ${hasCookie ? '✅' : '❌'}`);
  } catch (e) {
    console.log(`Cookie error: ${e.message}`);
  }

  // Check cookie size limits
  console.log('\n📏 COOKIE SIZE TEST:');
  try {
    // Try to set a 4KB cookie (reasonable size for JWT)
    const testData = new Array(4 * 1024).fill('x').join('');
    document.cookie = `sizeCookie=${testData}; path=/`;
    const success = document.cookie.includes('sizeCookie');
    console.log(`Can store 4KB cookie: ${success ? '✅' : '❌'}`);
  } catch (e) {
    console.log(`Cookie size test error: ${e.message}`);
  }

  // Look for existing auth cookies
  console.log('\n🔐 AUTH COOKIES:');
  const cookies = document.cookie.split(';').map(c => c.trim());
  const authCookies = cookies.filter(c => 
    c.startsWith('next-auth.') || 
    c.startsWith('__Secure-next-auth')
  );
  
  if (authCookies.length > 0) {
    console.log(`Found ${authCookies.length} auth-related cookies:`);
    authCookies.forEach(c => {
      const [name] = c.split('=');
      console.log(`- ${name}`);
    });
  } else {
    console.log('❌ No NextAuth.js cookies found');
  }

  // Check for any errors in console
  console.log('\n❌ ERRORS FROM SESSION START:');
  if (typeof window.__errors === 'undefined') {
    console.log('No error tracking available. Check console for red error messages.');
  } else {
    console.log(window.__errors);
  }

  // Detect if running in private/incognito mode
  console.log('\n🕵️ PRIVATE BROWSING:');
  let isPrivate = false;

  // Different browsers have different ways to detect private browsing
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(({quota}) => {
      isPrivate = quota < 120000000; // Smaller than 120MB usually means private
      console.log(`Private browsing (storage quota method): ${isPrivate ? 'Likely' : 'Unlikely'}`);
    });
  } else {
    console.log('Cannot detect private browsing mode');
  }

  // Save diagnostic info for troubleshooting
  console.log('\n📋 COPYING DIAGNOSTIC INFO TO CLIPBOARD:');
  const diagnosticInfo = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    features,
    cookies: {
      enabled: navigator.cookieEnabled,
      count: cookies.length,
      authCookies: authCookies.length
    },
    time: new Date().toISOString()
  };

  console.log(diagnosticInfo);
  console.log('\nPaste this information to the developer for troubleshooting');
  
  // Try to copy to clipboard
  try {
    navigator.clipboard.writeText(JSON.stringify(diagnosticInfo, null, 2))
      .then(() => console.log('✅ Copied to clipboard'))
      .catch(() => console.log('❌ Could not copy to clipboard'));
  } catch (e) {
    console.log('❌ Clipboard API not available');
  }
})(); 