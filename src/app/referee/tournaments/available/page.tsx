"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Search,
  Filter,
  CalendarCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import JoinTournamentButton from "@/components/tournaments/invitations/JoinTournamentButton";

interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  registeredPlayers: number;
  status: "upcoming" | "active" | "completed";
  registrationMode?: "OPEN" | "INVITATION" | "APPROVAL";
}

export default function AvailableTournamentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Check if user has the correct role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "REFEREE") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Fetch available tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would be an API call
        // const response = await fetch("/api/tournaments/available");
        // if (!response.ok) {
        //   throw new Error("Failed to fetch tournaments");
        // }
        // const data = await response.json();
        // setTournaments(data);
        
        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockTournaments: Tournament[] = [
          {
            id: 1,
            name: "Summer Grand Slam",
            startDate: "2023-07-15",
            endDate: "2023-07-20",
            location: "Central Sports Arena, New York",
            registeredPlayers: 64,
            status: "upcoming",
            registrationMode: "OPEN",
          },
          {
            id: 2,
            name: "City Championships",
            startDate: "2023-08-05",
            endDate: "2023-08-10",
            location: "City Sports Complex, Chicago",
            registeredPlayers: 32,
            status: "upcoming",
            registrationMode: "APPROVAL",
          },
          {
            id: 3,
            name: "Pro Circuit Tournament",
            startDate: "2023-06-20",
            endDate: "2023-06-25",
            location: "International Stadium, Los Angeles",
            registeredPlayers: 128,
            status: "upcoming",
            registrationMode: "INVITATION",
          },
          {
            id: 4,
            name: "Regional Qualifiers",
            startDate: "2023-05-10",
            endDate: "2023-05-15",
            location: "Regional Sports Center, Dallas",
            registeredPlayers: 48,
            status: "active",
            registrationMode: "OPEN",
          },
          {
            id: 5,
            name: "Masters Invitational",
            startDate: "2023-09-01",
            endDate: "2023-09-10",
            location: "Elite Club, Miami",
            registeredPlayers: 16,
            status: "upcoming",
            registrationMode: "INVITATION",
          },
        ];
        
        setTournaments(mockTournaments);
        setFilteredTournaments(mockTournaments);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast({
          title: "Error",
          description: "Failed to fetch available tournaments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchTournaments();
    }
  }, [status, toast]);

  // Filter tournaments based on search term and tab
  useEffect(() => {
    let filtered = tournaments;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tournament => 
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter(tournament => tournament.status === activeTab);
    }
    
    setFilteredTournaments(filtered);
  }, [tournaments, searchTerm, activeTab]);

  // Handle request to join a tournament
  const handleJoinRequested = () => {
    // In a real implementation, you would refresh the tournaments list or update UI
    toast({
      title: "Request Submitted",
      description: "Your request to join the tournament has been submitted. You'll be notified when it's approved.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Top navigation bar */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            Available Tournaments
          </h1>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => router.push("/referee/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and filter */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tournaments..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="sm:w-auto w-full flex items-center gap-2"
              onClick={() => setSearchTerm("")}
            >
              <Filter className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tournaments list */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <h2 className="text-xl font-semibold">Loading tournaments...</h2>
              <p className="text-muted-foreground">Please wait while we fetch available tournaments.</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No tournaments found</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                We couldn't find any tournaments matching your criteria. Try adjusting your search or check back later.
              </p>
            </div>
          ) : (
            filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{tournament.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {tournament.location}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        tournament.status === "upcoming" 
                          ? "outline" 
                          : tournament.status === "active" 
                          ? "default" 
                          : "secondary"
                      }
                      className={
                        tournament.status === "active" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                          : ""
                      }
                    >
                      {tournament.status === "upcoming" ? "Upcoming" : tournament.status === "active" ? "Active" : "Completed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6 py-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-teal-500" />
                        <p className="font-medium">
                          {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Registered Players</p>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        <p className="font-medium">{tournament.registeredPlayers}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Registration</p>
                      <div className="flex items-center">
                        <CalendarCheck className="h-4 w-4 mr-2 text-purple-500" />
                        <p className="font-medium">
                          {tournament.registrationMode === "OPEN" 
                            ? "Open Registration" 
                            : tournament.registrationMode === "INVITATION" 
                            ? "By Invitation Only" 
                            : "Requires Approval"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/tournaments/${tournament.id}`)}
                  >
                    View Details
                  </Button>
                  
                  <JoinTournamentButton
                    tournamentId={tournament.id}
                    tournamentName={tournament.name}
                    registrationMode={tournament.registrationMode}
                    onJoinRequested={handleJoinRequested}
                  />
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
} 