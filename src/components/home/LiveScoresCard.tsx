"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { TrophyIcon, ChevronRight, ActivityIcon, Loader2 } from "lucide-react";

interface Match {
  id: number;
  teamA: {
    name: string;
    score: number;
  };
  teamB: {
    name: string;
    score: number;
  };
  status: "upcoming" | "live" | "completed";
  tournamentName: string;
  round: string;
}

export default function LiveScoresCard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveMatches() {
      try {
        setLoading(true);
        const response = await fetch('/api/matches/live');
        
        if (response.ok) {
          const data = await response.json();
          setMatches(data.matches || []);
        } else {
          console.error("Failed to fetch live matches");
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveMatches();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchLiveMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  function getStatusBadgeStyles(status: string) {
    switch(status) {
      case 'live':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'upcoming':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'completed':
        return 'bg-gray-500 text-white hover:bg-gray-600';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  }

  return (
    <Card className="border-border shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <ActivityIcon className="h-5 w-5 mr-2 text-blue-500" />
          Live Scores
        </CardTitle>
        <CardDescription>
          Current tournament matches
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {loading ? (
          <div className="space-y-3 py-4">
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match) => (
              <div 
                key={match.id} 
                className="p-3 bg-accent/10 rounded-md border border-accent/20 hover:bg-accent/20 transition-colors duration-200"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {match.tournamentName} • {match.round}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium">{match.teamA.name}</div>
                    <div className="font-medium mt-1">{match.teamB.name}</div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-bold">{match.teamA.score}</div>
                    <div className="text-lg font-bold">{match.teamB.score}</div>
                  </div>
                  
                  <Badge 
                    variant={match.status === "live" ? "success" : "secondary"}
                    className="ml-3"
                  >
                    {match.status === "live" ? "LIVE" : match.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <TrophyIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="font-medium">No live matches</p>
            <p className="text-muted-foreground text-sm mt-1">Check back later for live scores</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Link href="/fantasy/live-scores" className="w-full">
          <Button 
            variant="outline" 
            className="w-full text-blue-500 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            View All Scores
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 