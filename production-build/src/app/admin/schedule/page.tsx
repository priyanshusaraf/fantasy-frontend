"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

interface Match {
  id: string;
  tournamentId: string;
  tournamentName: string;
  player1Name: string;
  player2Name: string;
  court: string;
  scheduledTime: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export default function SchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [tournaments, setTournaments] = useState<{id: string, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch matches
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/matches?status=SCHEDULED");
        if (!response.ok) throw new Error("Failed to fetch matches");
        const data = await response.json();
        setMatches(data);
        setFilteredMatches(data);
      } catch (error) {
        console.error("Error fetching matches:", error);
        toast({
          title: "Error",
          description: "Failed to load scheduled matches",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchTournaments = async () => {
      try {
        const response = await fetch("/api/tournaments");
        if (!response.ok) throw new Error("Failed to fetch tournaments");
        const data = await response.json();
        // Check if data is in the expected format and handle it accordingly
        const tournamentsArray = data.tournaments || data;
        if (Array.isArray(tournamentsArray)) {
          setTournaments(tournamentsArray.map((t: any) => ({ id: t.id, name: t.name })));
        } else {
          console.error("Tournaments data is not an array:", data);
          setTournaments([]);
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      }
    };

    fetchMatches();
    fetchTournaments();
  }, [toast]);

  // Filter matches based on selected date and tournament
  useEffect(() => {
    if (!matches.length) return;

    let filtered = [...matches];

    // Filter by date if selected
    if (selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      filtered = filtered.filter(match => 
        match.scheduledTime.startsWith(dateString)
      );
    }

    // Filter by tournament if selected
    if (tournamentFilter !== "all") {
      filtered = filtered.filter(match => match.tournamentId === tournamentFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(match => 
        match.player1Name.toLowerCase().includes(query) || 
        match.player2Name.toLowerCase().includes(query) ||
        match.court.toLowerCase().includes(query) ||
        match.tournamentName.toLowerCase().includes(query)
      );
    }

    setFilteredMatches(filtered);
  }, [selectedDate, tournamentFilter, searchQuery, matches]);

  const handleReschedule = async (matchId: string, newTime: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scheduledTime: newTime }),
      });

      if (!response.ok) throw new Error("Failed to reschedule match");
      
      // Update the matches state with the new scheduled time
      const updatedMatches = matches.map(match => 
        match.id === matchId ? { ...match, scheduledTime: newTime } : match
      );
      setMatches(updatedMatches);
      
      toast({
        title: "Success",
        description: "Match rescheduled successfully",
      });
    } catch (error) {
      console.error("Error rescheduling match:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule match",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Match Schedule</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Scheduled Matches</CardTitle>
            <CardDescription>View and manage all scheduled matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search players, courts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All Tournaments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tournaments</SelectItem>
                    {tournaments.map(tournament => (
                      <SelectItem key={tournament.id} value={tournament.id}>{tournament.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                Loading...
              </div>
            ) : (
              <>
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No scheduled matches found for the selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tournament</TableHead>
                          <TableHead>Players</TableHead>
                          <TableHead>Court</TableHead>
                          <TableHead>Scheduled Time</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMatches.map((match) => (
                          <TableRow key={match.id}>
                            <TableCell className="font-medium">{match.tournamentName}</TableCell>
                            <TableCell>{match.player1Name} vs {match.player2Name}</TableCell>
                            <TableCell>{match.court}</TableCell>
                            <TableCell>
                              {format(new Date(match.scheduledTime), "MMM dd, yyyy h:mm a")}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Reschedule</Button>
                                <Button variant="outline" size="sm">Cancel</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select date to filter matches</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="mx-auto"
            />
            {selectedDate && (
              <div className="mt-4 text-center">
                <p className="font-medium">
                  {format(selectedDate, "MMMM d, yyyy")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {filteredMatches.length} matches scheduled
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 