"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Define types to match the existing backend structure
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

interface Match {
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
  startTime: Date;
  endTime?: Date;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  round: string;
  player1Score: number;
  player2Score: number;
  winnerId?: number;
  maxScore: number;
  sets: number;
  courtNumber?: number;
}

interface SetScore {
  team1: number;
  team2: number;
}

export default function RefereeScoring() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0] mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading matches...</h2>
          <p>Please wait while we fetch available matches</p>
        </div>
      </div>
    }>
      <RefereeScoringContent />
    </Suspense>
  );
}

function RefereeScoringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");
  const { toast } = useToast();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  // If a matchId is provided in query params, redirect to the dynamic route
  useEffect(() => {
    if (matchId) {
      router.push(`/referee/live-scoring/${matchId}`);
    }
  }, [matchId, router]);
  
  // Fetch available matches
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/matches?status=SCHEDULED,IN_PROGRESS');
        if (!res.ok) throw new Error('Failed to fetch matches');
        
        const data = await res.json();
        setMatches(data);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast({
          title: "Error",
          description: "Failed to load matches",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [toast]);
  
  // Check if user has referee role
  useEffect(() => {
    if (user && user.role !== "REFEREE") {
      toast({
        title: "Access Denied",
        description: "You must be a referee to access this page",
        variant: "destructive",
      });
      router.push('/dashboard');
    }
  }, [user, router, toast]);
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading matches...</h2>
          <p>Please wait while we fetch available matches</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referee Scoring Panel</h1>
        <p className="text-muted-foreground">
          Select a match below to begin live scoring or view ongoing matches
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No Matches Available</h3>
            <p className="text-muted-foreground mb-6">There are no scheduled or in-progress matches at this time.</p>
            <Button onClick={() => router.push('/referee/create-match')}>
              Create New Match
            </Button>
          </div>
        ) : (
          matches.map((match) => (
            <Card 
              key={match.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                match.status === "IN_PROGRESS" ? "border-primary/50" : ""
              }`}
              onClick={() => router.push(`/referee/live-scoring/${match.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Match #{match.id}
                  </CardTitle>
                  <Badge variant={match.status === "IN_PROGRESS" ? "default" : "outline"}>
                    {match.status === "SCHEDULED" ? "Scheduled" : "In Progress"}
                  </Badge>
                </div>
                <CardDescription>
                  Round: {match.round} • {match.courtNumber ? `Court ${match.courtNumber}` : 'Court TBD'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-3 items-center py-2">
                  <div className="text-center">
                    <p className="font-medium truncate">
                      {match.team1?.name || match.player1?.name || "Team 1"}
                    </p>
                    {match.status === "IN_PROGRESS" && (
                      <p className="text-2xl font-bold mt-1">{match.player1Score}</p>
                    )}
                  </div>
                  
                  <div className="text-center text-muted-foreground">vs</div>
                  
                  <div className="text-center">
                    <p className="font-medium truncate">
                      {match.team2?.name || match.player2?.name || "Team 2"}
                    </p>
                    {match.status === "IN_PROGRESS" && (
                      <p className="text-2xl font-bold mt-1">{match.player2Score}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/referee/live-scoring/${match.id}`);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    {match.status === "IN_PROGRESS" ? "Continue Scoring" : "Start Scoring"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 