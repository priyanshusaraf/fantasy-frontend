"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Trophy, Users, MapPin, Clock, Filter } from "lucide-react";
import { toast } from "sonner";

interface MatchHistory {
  id: number;
  tournamentName: string;
  tournamentId: number;
  matchNumber: string;
  round: string;
  court: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  winner: string;
  status: "COMPLETED" | "CANCELLED" | "DISPUTED";
  duration: string;
}

export default function RefereeHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/referee/history");
    } else if (session?.user && (session.user.role !== "REFEREE" && session.user.role !== "ADMIN")) {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  // Fetch referee match history
  useEffect(() => {
    const fetchMatchHistory = async () => {
      if (session?.user) {
        try {
          setLoading(true);
          
          // Fetch from real API endpoint
          const response = await fetch("/api/referee/matches/history");
          
          if (!response.ok) {
            throw new Error("Failed to fetch match history");
          }
          
          const data = await response.json();
          setMatches(data.matches || []);
        } catch (error) {
          console.error("Error fetching match history:", error);
          toast.error("Failed to load match history. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    if (session?.user) {
      fetchMatchHistory();
    }
  }, [session]);

  // Filter matches based on search term and status filter
  const filteredMatches = matches.filter(match => {
    // Apply status filter
    if (filter && match.status !== filter) {
      return false;
    }
    
    // Apply search
    if (searchTerm && 
        !match.tournamentName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !match.team1.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !match.team2.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !match.round.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading match history...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Referee Match History</CardTitle>
            <CardDescription>Please sign in to view your match history</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login?redirect=/referee/history")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          Match History
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          View all matches you have refereed, including completed, cancelled, and disputed matches.
        </p>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by tournament, players, or round..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={filter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          <Button 
            variant={filter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("COMPLETED")}
          >
            Completed
          </Button>
          <Button 
            variant={filter === "CANCELLED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("CANCELLED")}
          >
            Cancelled
          </Button>
          <Button 
            variant={filter === "DISPUTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("DISPUTED")}
          >
            Disputed
          </Button>
        </div>
      </div>
      
      {/* Match history list */}
      {filteredMatches.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No matches found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {filter 
                ? `No ${filter.toLowerCase()} matches found. Try changing the filter or clearing your search.` 
                : "You haven't refereed any matches yet, or no matches match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <Card key={match.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 bg-muted/30 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{match.tournamentName}</h3>
                      <p className="text-sm text-muted-foreground">{match.round}</p>
                      <p className="text-sm text-muted-foreground mt-1">{match.matchNumber}</p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center text-sm mb-1">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{match.date}</span>
                      </div>
                      <div className="flex items-center text-sm mb-1">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{match.time}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{match.court}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-3/4 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="grid grid-cols-3 gap-4 w-full">
                        <div className="col-span-1 text-center">
                          <p className="font-medium mb-2">{match.team1}</p>
                          <div className="text-3xl font-bold">{match.score1}</div>
                        </div>
                        
                        <div className="col-span-1 flex flex-col items-center justify-center">
                          <p className="text-sm text-muted-foreground mb-2">VS</p>
                          {match.status === "COMPLETED" && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Completed
                            </Badge>
                          )}
                          {match.status === "CANCELLED" && (
                            <Badge variant="destructive">
                              Cancelled
                            </Badge>
                          )}
                          {match.status === "DISPUTED" && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              Disputed
                            </Badge>
                          )}
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <p className="font-medium mb-2">{match.team2}</p>
                          <div className="text-3xl font-bold">{match.score2}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between border-t pt-4 mt-4">
                      <div className="flex items-center gap-4">
                        {match.status === "COMPLETED" && (
                          <>
                            <div className="flex items-center text-sm">
                              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                              <span className="font-medium">Winner: {match.winner}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Duration: {match.duration}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/referee/matches/${match.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 