// src/app/tournaments/[id]/contests/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Calendar, Trophy, Users } from "lucide-react";
import ContestList from "@/components/fantasy-pickleball/ContestList";
import { useAuth } from "@/hooks/useAuth";

interface TournamentDetailProps {
  params: {
    id: string;
  };
}

interface Tournament {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  imageUrl?: string;
}

export default function TournamentContestsPage({
  params,
}: TournamentDetailProps) {
  const tournamentId = parseInt(params.id);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tournament");
        }
        const data = await response.json();
        setTournament(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [tournamentId]);

  const handleCreateContest = () => {
    router.push(`/tournaments/${tournamentId}/create-contest`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        Loading tournament details...
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <p className="font-bold">Error loading tournament</p>
          <p>{error || "Tournament not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#00a1e0]">
            {tournament.name}
          </h1>
          <p className="text-gray-600 mt-1">{tournament.location}</p>
        </div>

        {isAuthenticated && user?.role === "admin" && (
          <Button
            className="mt-4 md:mt-0 bg-[#00a1e0] hover:bg-[#0072a3]"
            onClick={handleCreateContest}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Create New Contest
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center">
            <Calendar className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Tournament Dates</p>
              <p className="font-medium">
                {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                {new Date(tournament.endDate).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <Trophy className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                {tournament.status.replace("_", " ")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <Users className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Fantasy Contests</p>
              <p className="font-medium">Join Now</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="text-2xl">Available Fantasy Contests</CardTitle>
        </CardHeader>
        <CardContent>
          <ContestList tournamentId={tournamentId} showAll={true} />
        </CardContent>
      </Card>

      <div className="bg-[#fff5fc] rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-[#5b62b3]">
          Rules and Scoring
        </h2>
        <div className="text-[#5b62b3]/70 space-y-3">
          <p>
            <strong>Match Scoring:</strong> If a player wins a game by 11-0 they
            get 15 points extra and if they win under 5 then they get 10 points.
          </p>
          <p>
            <strong>Captaincy:</strong> Points for your captain are multiplied
            by 2x, and vice-captain by 1.5x.
          </p>
          <p>
            <strong>Knockout Stages:</strong> Points multiply 1.5x during
            knockout stages.
          </p>
          <p>
            <strong>MVP Bonus:</strong> 50 points extra for Tournament MVP (only
            if selected from day 1).
          </p>
        </div>
      </div>
    </div>
  );
}
