import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { RefereeScoring } from '@/components/referee/RefereeScoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

async function getRefereeMatches(userId: string) {
  const referee = await prisma.referee.findFirst({
    where: {
      user: {
        id: parseInt(userId),
      },
    },
    include: {
      assignedMatches: {
        include: {
          tournament: true,
          player1: true,
          player2: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      },
    },
  });

  return referee?.assignedMatches || [];
}

export default async function RefereeMatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const matches = await getRefereeMatches(session.user.id);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Matches</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <Card key={match.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {match.tournament.name}
                </CardTitle>
                <Badge variant={
                  match.status === 'IN_PROGRESS' ? 'default' :
                  match.status === 'COMPLETED' ? 'secondary' :
                  'outline'
                }>
                  {match.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{match.player1.name}</p>
                    <p className="text-sm text-gray-500">Player 1</p>
                  </div>
                  <div className="px-4 text-xl font-bold">
                    {match.player1Score ?? 0}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{match.player2.name}</p>
                    <p className="text-sm text-gray-500">Player 2</p>
                  </div>
                  <div className="px-4 text-xl font-bold">
                    {match.player2Score ?? 0}
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(match.startTime).toLocaleString()}
                  </p>
                  {match.status === 'SCHEDULED' && (
                    <Button asChild className="w-full">
                      <Link href={`/referee/matches/${match.id}`}>
                        Start Match
                      </Link>
                    </Button>
                  )}
                  {match.status === 'IN_PROGRESS' && (
                    <Button asChild className="w-full">
                      <Link href={`/referee/matches/${match.id}`}>
                        Continue Match
                      </Link>
                    </Button>
                  )}
                  {match.status === 'COMPLETED' && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/referee/matches/${match.id}`}>
                        View Details
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {matches.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No matches assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 