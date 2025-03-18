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
import { Button } from "@/components/ui/Button";
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
import { Input } from "@/components/ui/Input";
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
  description?: string;
  imageUrl?: string;
  status: string;
  registrationStatus: string;
  refereeCount: number;
  refereeNeeded: number;
  playerCount: number;
  applicationStatus: string;
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
        
        // Real API call to fetch tournaments
        const response = await fetch("/api/referee/tournaments");
        if (!response.ok) {
          throw new Error("Failed to fetch tournaments");
        }
        const data = await response.json();
        
        console.log("API Response:", data);
        
        setTournaments(data.tournaments || []);
        setFilteredTournaments(data.tournaments || []);
        
        console.log("Setting tournaments:", data.tournaments?.length || 0);
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
      filtered = filtered.filter(tournament => {
        // Map database status values to UI tab values
        const statusMap: Record<string, string> = {
          "DRAFT": "upcoming",
          "REGISTRATION_OPEN": "upcoming",
          "REGISTRATION_CLOSED": "upcoming",
          "IN_PROGRESS": "active",
          "COMPLETED": "completed",
          "CANCELLED": "completed"
        };
        
        const mappedStatus = statusMap[tournament.status] || "upcoming";
        return mappedStatus === activeTab;
      });
    }
    
    setFilteredTournaments(filtered);
  }, [tournaments, searchTerm, activeTab]);

  // Handle request to join a tournament
  const handleJoinRequested = async (tournamentId: number) => {
    try {
      const response = await fetch(`/api/referee/tournaments/${tournamentId}/join`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to join tournament');
      
      toast({
        title: "Request Submitted",
        description: "Your request to join the tournament has been submitted. You'll be notified when it's approved.",
      });
      
      // Refresh tournaments list
      const refreshResponse = await fetch("/api/referee/tournaments");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error("Error joining tournament:", error);
      toast({
        title: "Error",
        description: "Failed to submit join request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Also update the status display in the tournament card to show more friendly values
  const getDisplayStatus = (status: string): string => {
    switch(status) {
      case "DRAFT": return "Upcoming";
      case "REGISTRATION_OPEN": return "Registration Open";
      case "REGISTRATION_CLOSED": return "Registration Closed";
      case "IN_PROGRESS": return "Active";
      case "COMPLETED": return "Completed";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
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
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No tournaments found</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  {activeTab !== "all" 
                    ? `No ${activeTab.toLowerCase()} tournaments found. Try changing the filter or clearing your search.` 
                    : "No tournaments found matching your criteria. Try adjusting your search or check back later."}
                </p>
                <div className="mt-4 p-4 bg-muted/30 rounded-md text-left">
                  <p className="text-sm">Debug Info:</p>
                  <p className="text-xs">Total tournaments from API: {tournaments.length}</p>
                  <p className="text-xs">Filtered tournaments: {filteredTournaments.length}</p>
                  <p className="text-xs">Active tab: {activeTab}</p>
                  <p className="text-xs">Search term: {searchTerm || '(none)'}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/3 h-48 md:h-auto relative">
                    <div 
                      className="h-full bg-cover bg-center" 
                      style={{ 
                        backgroundImage: `url(${tournament.imageUrl || "https://placehold.co/600x400?text=Tournament+Banner"})`,
                      }}
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{tournament.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          {tournament.description?.substring(0, 120)}{tournament.description && tournament.description.length > 120 ? "..." : ""}
                        </p>
                      </div>
                      <Badge 
                        className="capitalize"
                        variant={
                          tournament.status.toLowerCase() === "upcoming" ? "outline" : 
                          tournament.status.toLowerCase() === "active" ? "default" : 
                          "secondary"
                        }
                      >
                        {getDisplayStatus(tournament.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <p>From: {new Date(tournament.startDate).toLocaleDateString()}</p>
                          <p>To: {new Date(tournament.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{tournament.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>
                          Referees: {tournament.refereeCount}/{tournament.refereeNeeded}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t">
                      <div>
                        <Badge 
                          variant="outline"
                          className={
                            tournament.registrationStatus === "OPEN" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }
                        >
                          Registration {tournament.registrationStatus}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/referee/tournaments/${tournament.id}`)}
                        >
                          View Details
                        </Button>
                        
                        {tournament.applicationStatus === "NOT_APPLIED" && tournament.registrationStatus === "OPEN" && (
                          <Button
                            size="sm"
                            onClick={() => handleJoinRequested(tournament.id)}
                          >
                            Apply as Referee
                          </Button>
                        )}
                        
                        {tournament.applicationStatus === "PENDING" && (
                          <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Application Pending
                          </Badge>
                        )}
                        
                        {tournament.applicationStatus === "APPROVED" && (
                          <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Approved Referee
                          </Badge>
                        )}
                        
                        {tournament.applicationStatus === "REJECTED" && (
                          <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Application Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
} 