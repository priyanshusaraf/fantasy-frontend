/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Disable unnecessary telemetry in production
  telemetry: process.env.NODE_ENV === 'production' ? false : true,
  
  // Configure headers for better security
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  // Redirect HTTP to HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === 'production'
      ? [
          {
            source: '/:path*',
            has: [
              {
                type: 'header',
                key: 'x-forwarded-proto',
                value: 'http'
              }
            ],
            permanent: true,
            destination: 'https://:host/:path*'
          }
        ]
      : [];
  },
  
  // Configure image optimization
  images: {
    domains: [
      'assets.razorpay.com',
      'lh3.googleusercontent.com', // For Google profile pictures
      'avatars.githubusercontent.com' // If using GitHub auth
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 // Cache optimized images for at least 60 seconds
  },
  
  // Use the SWC compiler for faster builds
  swcMinify: true,
  
  // Configure environment variables that should be available to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID
  },
  
  // Disable webpack5 features that might cause issues
  webpack: (config) => {
    // Fixes npm packages that depend on `fs` module
    if (!config.node) {
      config.node = {};
    }
    
    config.node.__dirname = true;
    
    return config;
  },
  
  // Improve output in production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

module.exports = nextConfig;
