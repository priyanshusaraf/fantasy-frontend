"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  TrophyIcon,
  Users,
  Timer,
  ChevronRight,
  User,
  AlertCircle,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import SimplifiedScoring from "@/components/live-scoring/SimplifiedScoring";
import { Skeleton } from "@/components/ui/skeleton";

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
  team1: Team;
  team2: Team;
  player1Score: number;
  player2Score: number;
  tournamentId: number;
  tournamentName: string;
  round: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  startTime: string;
  courtNumber: number;
  currentSet: number;
  sets: number;
  maxScore: number;
  isGoldenPoint: boolean;
  setScores?: Array<{
    set: number;
    team1Score: number;
    team2Score: number;
  }>;
}

interface Tournament {
  id: number;
  name: string;
  logo?: string;
  liveMatchCount: number;
}

export default function LiveScoresPage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchLiveScores = async () => {
      try {
        // Fetch live matches
        const liveResponse = await fetch('/api/matches?status=IN_PROGRESS');
        if (!liveResponse.ok) throw new Error('Failed to fetch live matches');
        const liveData = await liveResponse.json();
        setLiveMatches(liveData.matches || []);

        // Fetch upcoming matches
        const upcomingResponse = await fetch('/api/matches?status=SCHEDULED&limit=5');
        if (!upcomingResponse.ok) throw new Error('Failed to fetch upcoming matches');
        const upcomingData = await upcomingResponse.json();
        setUpcomingMatches(upcomingData.matches || []);

        // Fetch recent matches
        const recentResponse = await fetch('/api/matches?status=COMPLETED&limit=5');
        if (!recentResponse.ok) throw new Error('Failed to fetch recent matches');
        const recentData = await recentResponse.json();
        setRecentMatches(recentData.matches || []);

        // Fetch tournaments with live matches
        const tournamentsResponse = await fetch('/api/tournaments?hasLiveMatches=true');
        if (!tournamentsResponse.ok) throw new Error('Failed to fetch tournaments');
        const tournamentsData = await tournamentsResponse.json();
        setTournaments(tournamentsData.tournaments || []);

        setError(null);
      } catch (err) {
        console.error('Error fetching live scores:', err);
        setError('Failed to load live scores. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveScores();

    // Set up polling for live matches - update every 10 seconds
    const pollingInterval = setInterval(fetchLiveScores, 10000);

    return () => clearInterval(pollingInterval);
  }, []);

  // Filter matches by tournament if one is selected
  const filteredLiveMatches = liveMatches.filter(match => 
    !selectedTournament || match.tournamentId === selectedTournament
  ).filter(match => 
    searchTerm === "" || 
    match.team1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.team2.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.team1.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    match.team2.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    match.tournamentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecentMatches = recentMatches.filter(match => 
    !selectedTournament || match.tournamentId === selectedTournament
  ).filter(match => 
    searchTerm === "" || 
    match.team1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.team2.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.team1.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    match.team2.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    match.tournamentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUpcomingMatches = upcomingMatches.filter(match => 
    !selectedTournament || match.tournamentId === selectedTournament
  ).filter(match => 
    searchTerm === "" || 
    match.team1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.team2.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.team1.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    match.team2.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    match.tournamentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Live Scores</h1>
          <p className="text-muted-foreground">
            Follow live matches from all tournaments
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTournament === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTournament(null)}
          >
            All Tournaments
          </Button>
          {tournaments.map((tournament) => (
            <Button
              key={tournament.id}
              variant={selectedTournament === tournament.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTournament(tournament.id)}
              className="flex items-center gap-1"
            >
              {tournament.logo && (
                <div className="w-4 h-4 relative">
                  <Image
                    src={tournament.logo}
                    alt={tournament.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              {tournament.name}
              {tournament.liveMatchCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tournament.liveMatchCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by player, team, or tournament..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live" className="flex items-center gap-1">
            <Timer className="h-4 w-4" />
            Live Matches
            {filteredLiveMatches.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filteredLiveMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="recent">Recent Results</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-40" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Unable to load live scores</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : filteredLiveMatches.length === 0 ? (
            <div className="text-center py-12">
              <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No live matches</h3>
              <p className="text-muted-foreground">
                There are no matches currently in progress.
                {selectedTournament && " Try selecting a different tournament."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredLiveMatches.slice(0, 4).map((match) => (
                <Link href={`/match/${match.id}`} key={match.id}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className="mb-1">{match.round}</Badge>
                          <CardTitle className="text-lg flex items-center">
                            <TrophyIcon className="h-4 w-4 mr-2 text-primary" />
                            {match.tournamentName}
                          </CardTitle>
                        </div>
                        <Badge variant="secondary">Court {match.courtNumber}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <SimplifiedScoring match={match} />
                      <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Timer className="h-3 w-3 mr-1" />
                          <span>{new Date(match.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs gap-1">
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {filteredLiveMatches.length > 4 && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => router.push('/all-matches?status=live')}>
                View All {filteredLiveMatches.length} Live Matches
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredUpcomingMatches.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No upcoming matches</h3>
              <p className="text-muted-foreground">
                There are no scheduled matches at the moment.
                {selectedTournament && " Try selecting a different tournament."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUpcomingMatches.map((match) => (
                <Link href={`/match/${match.id}`} key={match.id}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1 flex items-center">
                            <TrophyIcon className="h-3 w-3 mr-1" />
                            {match.tournamentName} - {match.round}
                          </div>
                          <div className="font-medium">
                            {match.team1.players.map(p => p.name).join(' & ')} vs {match.team2.players.map(p => p.name).join(' & ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {new Date(match.startTime).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-sm">Court {match.courtNumber}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {filteredUpcomingMatches.length > 0 && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => router.push('/all-matches?status=upcoming')}>
                View All Upcoming Matches
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredRecentMatches.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No recent matches</h3>
              <p className="text-muted-foreground">
                There are no recently completed matches.
                {selectedTournament && " Try selecting a different tournament."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecentMatches.map((match) => (
                <Link href={`/match/${match.id}`} key={match.id}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1 flex items-center">
                            <TrophyIcon className="h-3 w-3 mr-1" />
                            {match.tournamentName} - {match.round}
                          </div>
                          <div className="font-medium">
                            {match.team1.players.map(p => p.name).join(' & ')} vs {match.team2.players.map(p => p.name).join(' & ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">
                            {match.player1Score} - {match.player2Score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Final Score
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {filteredRecentMatches.length > 0 && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => router.push('/all-matches?status=completed')}>
                View All Completed Matches
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 