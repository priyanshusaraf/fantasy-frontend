import { Prisma } from '@prisma/client';

declare global {
  namespace PrismaJson {
    // Add custom JSON types if needed
  }
}

// Augment the Prisma namespace
declare module '@prisma/client' {
  namespace Prisma {
    // Add isTeamBased to tournament input
    interface TournamentCreateInput {
      isTeamBased?: boolean;
    }
    
    interface TournamentUncheckedCreateInput {
      isTeamBased?: boolean;
    }
    
    // Add tournamentId to team input
    interface TeamCreateInput {
      tournamentId?: number;
    }
    
    interface TeamUncheckedCreateInput {
      tournamentId?: number;
    }
  }
}

export {}; 