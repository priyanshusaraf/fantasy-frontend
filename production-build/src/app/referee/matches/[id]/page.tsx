import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { RefereeScoring } from '@/components/referee/RefereeScoring';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

async function getMatchDetails(matchId: string) {
  const match = await prisma.match.findUnique({
    where: {
      id: parseInt(matchId),
    },
    include: {
      tournament: true,
      player1: true,
      player2: true,
      referee: {
        include: {
          user: true,
        },
      },
      playerPoints: true,
    },
  });

  return match;
}

export default async function RefereeMatchPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const match = await getMatchDetails(params.id);
  if (!match) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
          <p className="text-gray-500 mb-4">
            The match you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/referee/matches">Back to Matches</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Verify that the current user is the referee for this match
  if (match.referee?.user?.id.toString() !== session.user.id) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p className="text-gray-500 mb-4">
            You are not authorized to manage this match.
          </p>
          <Button asChild>
            <Link href="/referee/matches">Back to Matches</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // If match is scheduled, start it
  if (match.status === 'SCHEDULED') {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        status: 'IN_PROGRESS',
        startTime: new Date(),
      },
    });
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{match.tournament.name}</h1>
          <p className="text-gray-500">Match #{match.id}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/referee/matches">Back to Matches</Link>
        </Button>
      </div>

      <RefereeScoring matchId={match.id} />
    </div>
  );
} 