"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  imageUrl?: string;
}

interface Team {
  id: number;
  name: string;
  players: Player[];
}

export interface Match {
  id: number;
  tournamentId: number;
  player1Id?: number;
  player2Id?: number;
  team1Id?: number;
  team2Id?: number;
  player1?: Player;
  player2?: Player;
  team1?: Team;
  team2?: Team;
  startTime: string;
  endTime?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  round: string;
  player1Score: number;
  player2Score: number;
  winnerId?: number;
  maxScore: number;
  sets: number;
  courtNumber?: number;
}

export default function EditMatchPage() {
  const router = useRouter();
  const params = useParams() as { matchId: string };
  const matchId = parseInt(params.matchId, 10);

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch match details on component mount
  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/matches/${matchId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch match details");
        }
        const data = await res.json();
        setMatch(data);
        setTeam1Score(data.player1Score || 0);
        setTeam2Score(data.player2Score || 0);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  // Handler for updating match details
  const handleUpdate = async () => {
    if (!match) return;

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1Score: team1Score,
          player2Score: team2Score,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update match");
      }
      const updatedMatch = await res.json();
      setMatch(updatedMatch);
      toast.success("Match updated successfully");
      // Optionally, redirect to the match score page
      router.push(`/referee/match/${matchId}/score`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading match details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-4">
        <p>Match not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-[#00a1e0]">Edit Match</CardTitle>
          <CardDescription>
            Edit the scores and review match details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-lg font-semibold">
              {match.team1?.name || match.player1?.name} vs{" "}
              {match.team2?.name || match.player2?.name}
            </p>
            <p className="text-sm text-gray-500">Round: {match.round}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team 1 Score
              </label>
              <Input
                type="number"
                value={team1Score}
                onChange={(e) => setTeam1Score(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team 2 Score
              </label>
              <Input
                type="number"
                value={team2Score}
                onChange={(e) => setTeam2Score(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Update Match</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
