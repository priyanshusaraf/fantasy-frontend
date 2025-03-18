"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Star,
  StarOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TeamViewPageProps {
  params: {
    id: string;
  };
}

interface Player {
  id: number;
  name: string;
  skillLevel?: string;
  country?: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

interface Team {
  id: number;
  name: string;
  totalPoints: number;
  rank?: number;
  players: Player[];
}

export default function TeamViewPage({ params }: TeamViewPageProps) {
  const contestId = params.id;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchTeam = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/fantasy-pickleball/contests/${contestId}/user-team`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch team");
        }
        
        const data = await response.json();
        
        if (!data.team) {
          router.push(`/fantasy/contests/${contestId}/join`);
          return;
        }
        
        setTeam(data.team);
      } catch (error) {
        console.error("Error fetching team:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchTeam();
    }
  }, [contestId, router, status]);

  const getSkillLevelColor = (skillLevel?: string) => {
    switch (skillLevel) {
      case "BEGINNER":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ADVANCED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "PROFESSIONAL":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-medium">Loading your team...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push(`/fantasy/contests/${contestId}`)}
        >
          Back to Contest
        </Button>
      </div>
    );
  }

  if (!team) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.push(`/fantasy/contests/${contestId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Contest
      </Button>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground mt-1">Your Fantasy Team</p>
          </div>
          
          {team.rank && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-base px-3 py-1">
              <Trophy className="h-4 w-4 mr-2" />
              Rank: {team.rank}
            </Badge>
          )}
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Current points and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/5 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                <p className="text-3xl font-bold">{team.totalPoints}</p>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Players</p>
                <p className="text-3xl font-bold">{team.players.length}</p>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Rank</p>
                <p className="text-3xl font-bold">{team.rank || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Team Players</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Your selected players and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {team.players.map((player) => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`/player-images/${player.id}.jpg`} alt={player.name} />
                      <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{player.name}</p>
                        {player.isCaptain && (
                          <Badge variant="default" className="bg-yellow-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Captain
                          </Badge>
                        )}
                        {player.isViceCaptain && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            <StarOff className="h-3 w-3 mr-1" />
                            Vice Captain
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        {player.skillLevel && (
                          <Badge variant="outline" className={getSkillLevelColor(player.skillLevel)}>
                            {player.skillLevel.charAt(0) + player.skillLevel.slice(1).toLowerCase()}
                          </Badge>
                        )}
                        
                        {player.country && (
                          <span className="text-xs text-muted-foreground">
                            {player.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {player.isCaptain && "2x points"}
                      {player.isViceCaptain && "1.5x points"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/fantasy/contests/${contestId}`)}
            >
              Back to Contest
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 