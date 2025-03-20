const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const getOptionalEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

// Exclude email variables from required env vars
const isEmailVariable = (key: string): boolean => {
  return key.startsWith('EMAIL_');
};

const getSafeEnvVar = (key: string, defaultValue: string = ''): string => {
  if (process.env.NODE_ENV !== 'production' && isEmailVariable(key)) {
    return getOptionalEnvVar(key, defaultValue);
  }
  
  try {
    return getEnvVar(key);
  } catch (error) {
    if (isEmailVariable(key)) {
      return defaultValue;
    }
    throw error;
  }
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  NEXTAUTH_URL: getEnvVar('NEXTAUTH_URL'),
  NEXTAUTH_SECRET: getEnvVar('NEXTAUTH_SECRET'),
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  ADMIN_KEY: getEnvVar('ADMIN_KEY'),
  RAZORPAY_KEY_ID: getEnvVar('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: getEnvVar('RAZORPAY_KEY_SECRET'),
  RAZORPAY_WEBHOOK_SECRET: process.env.NODE_ENV === 'production' 
    ? getEnvVar('RAZORPAY_WEBHOOK_SECRET') 
    : getOptionalEnvVar('RAZORPAY_WEBHOOK_SECRET', 'dev_webhook_secret'),
  // Email variables - always optional in development, with safe fallbacks
  EMAIL_SERVER_HOST: getSafeEnvVar('EMAIL_SERVER_HOST', 'localhost'),
  EMAIL_SERVER_PORT: process.env.NODE_ENV === 'production' 
    ? parseInt(getEnvVar('EMAIL_SERVER_PORT'))
    : 1025,
  EMAIL_SERVER_USER: getSafeEnvVar('EMAIL_SERVER_USER', 'test'),
  EMAIL_SERVER_PASSWORD: getSafeEnvVar('EMAIL_SERVER_PASSWORD', 'password'),
  EMAIL_FROM: getSafeEnvVar('EMAIL_FROM', 'no-reply@matchup.local'),
  BYPASS_RAZORPAY: process.env.BYPASS_RAZORPAY === 'true',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const; 