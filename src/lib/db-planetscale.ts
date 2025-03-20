import { PrismaClient } from '@prisma/client';

// Create a global client to avoid too many connections in serverless environments
const globalForPrisma = globalThis as unknown as {
  planetscale: PrismaClient | undefined;
};

// Configuration for PlanetScale to work well with serverless
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // PlanetScale-specific connection settings for better performance
    // Remove these if not using PlanetScale
    /*
    connectionLimit: 1,
    pool: {
      min: 0,
      max: 1,
    },
    */
  });
};

const planetscale = globalForPrisma.planetscale ?? prismaClientSingleton();

export default planetscale;

// In development, preserve the client between hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.planetscale = planetscale; 