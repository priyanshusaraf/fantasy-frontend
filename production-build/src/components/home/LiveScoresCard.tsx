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
import { TrophyIcon, ChevronRight, ActivityIcon } from "lucide-react";

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

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center">
          <ActivityIcon className="h-5 w-5 mr-2 text-[#27D3C3]" />
          Live Scores
        </CardTitle>
        <CardDescription className="text-gray-400">
          Current tournament matches
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-700 animate-pulse rounded-md"></div>
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match) => (
              <div 
                key={match.id} 
                className="p-3 bg-gray-700/50 rounded-md border border-gray-600"
              >
                <div className="text-xs text-gray-400 mb-1">
                  {match.tournamentName} • {match.round}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-white">{match.teamA.name}</div>
                    <div className="font-medium text-white mt-1">{match.teamB.name}</div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-bold text-white">{match.teamA.score}</div>
                    <div className="text-lg font-bold text-white">{match.teamB.score}</div>
                  </div>
                  
                  <Badge 
                    className={
                      match.status === "live" 
                        ? "ml-3 bg-green-600 text-white" 
                        : "ml-3 bg-gray-600 text-white"
                    }
                  >
                    {match.status === "live" ? "LIVE" : match.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <TrophyIcon className="h-10 w-10 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-300 font-medium">No live matches</p>
            <p className="text-gray-400 text-sm mt-1">Check back later for live scores</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Link href="/fantasy/live-scores" className="w-full">
          <Button 
            variant="outline" 
            className="w-full text-[#27D3C3] hover:text-[#27D3C3]/90 border-[#27D3C3]/20 hover:bg-[#27D3C3]/10"
          >
            View All Scores
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 