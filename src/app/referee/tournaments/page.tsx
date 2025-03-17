"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Trophy, MapPin, Users, CheckCircle, XCircle, Filter } from "lucide-react";

interface Tournament {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  registrationStatus: string;
  refereeCount: number;
  refereeNeeded: number;
  playerCount: number;
  applicationStatus?: string;
  imageUrl?: string;
}

export default function RefereeTournamentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/referee/tournaments");
    } else if (session?.user && (session.user.role !== "REFEREE" && session.user.role !== "ADMIN")) {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  // Fetch available tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      if (session?.user) {
        try {
          setLoading(true);
          
          // Fetch from API endpoint
          const response = await fetch("/api/referee/tournaments");
          
          if (!response.ok) {
            throw new Error("Failed to fetch tournaments");
          }
          
          const data = await response.json();
          console.log("API Response for tournaments:", data);
          setTournaments(data.tournaments || []);
        } catch (error) {
          console.error("Error fetching tournaments:", error);
          // Don't use mock data, just show an empty state
          setTournaments([]);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session?.user) {
      fetchTournaments();
    }
  }, [session]);

  // Filter tournaments based on search term and status filter
  const filteredTournaments = tournaments.filter(tournament => {
    // Apply status filter
    if (filter) {
      // Map database statuses to UI filter values
      const statusMap: Record<string, string> = {
        "DRAFT": "UPCOMING",
        "REGISTRATION_OPEN": "UPCOMING",
        "REGISTRATION_CLOSED": "UPCOMING",
        "IN_PROGRESS": "ACTIVE",
        "COMPLETED": "COMPLETED",
        "CANCELLED": "CANCELLED"
      };
      
      const mappedStatus = statusMap[tournament.status] || tournament.status;
      if (mappedStatus !== filter) return false;
    }
    
    // Apply search
    if (searchTerm && 
        !tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !tournament.location.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !tournament.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Map display status for tournament status values
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

  // Group tournaments by application status - update filters to use mapped statuses
  const upcomingTournaments = filteredTournaments.filter(t => {
    const statusMap: Record<string, string> = {
      "DRAFT": "UPCOMING",
      "REGISTRATION_OPEN": "UPCOMING",
      "REGISTRATION_CLOSED": "UPCOMING"
    };
    const mappedStatus = statusMap[t.status] || t.status;
    return mappedStatus === "UPCOMING" && t.applicationStatus !== "ACCEPTED" && t.applicationStatus !== "PENDING";
  });
  const pendingTournaments = filteredTournaments.filter(t => t.applicationStatus === "PENDING");
  const assignedTournaments = filteredTournaments.filter(t => {
    const statusMap: Record<string, string> = {
      "COMPLETED": "COMPLETED",
      "CANCELLED": "CANCELLED"
    };
    const mappedStatus = statusMap[t.status] || "ACTIVE";
    return t.applicationStatus === "ACCEPTED" && mappedStatus !== "COMPLETED";
  });
  const completedTournaments = filteredTournaments.filter(t => {
    const statusMap: Record<string, string> = {
      "COMPLETED": "COMPLETED",
      "CANCELLED": "COMPLETED"
    };
    const mappedStatus = statusMap[t.status] || t.status;
    return mappedStatus === "COMPLETED";
  });

  // Handle applying to a tournament
  const handleApply = async (tournamentId: number) => {
    try {
      // Send API request to apply for the tournament
      const response = await fetch(`/api/referee/tournaments/${tournamentId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to apply to tournament");
      }
      
      // Update local state on success
      setTournaments(prev => 
        prev.map(tournament => 
          tournament.id === tournamentId 
            ? { ...tournament, applicationStatus: "PENDING" } 
            : tournament
        )
      );
    } catch (error) {
      console.error("Error applying to tournament:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Referee Tournaments</CardTitle>
            <CardDescription>Please sign in to browse available tournaments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login?redirect=/referee/tournaments")}>
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
          Tournament Opportunities
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Browse and apply to referee at upcoming pickleball tournaments.
        </p>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tournaments by name or location..."
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
            variant={filter === "UPCOMING" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("UPCOMING")}
          >
            Upcoming
          </Button>
          <Button 
            variant={filter === "ACTIVE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ACTIVE")}
          >
            Active
          </Button>
          <Button 
            variant={filter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("COMPLETED")}
          >
            Completed
          </Button>
        </div>
      </div>
      
      {/* No tournaments state */}
      {filteredTournaments.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-medium mb-2">No tournaments found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filter 
                  ? "No tournaments match your current filters. Try adjusting your search or filter criteria."
                  : "There are no available tournaments at the moment. Please check back later."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tournaments Tabs */}
      {filteredTournaments.length > 0 && (
        <Tabs defaultValue={assignedTournaments.length > 0 ? "assigned" : (pendingTournaments.length > 0 ? "pending" : "available")}>
          <TabsList className="mb-6">
            <TabsTrigger value="available" disabled={upcomingTournaments.length === 0}>
              Available ({upcomingTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="pending" disabled={pendingTournaments.length === 0}>
              Pending ({pendingTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" disabled={assignedTournaments.length === 0}>
              Assigned ({assignedTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" disabled={completedTournaments.length === 0}>
              Completed ({completedTournaments.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Available Tournaments */}
          <TabsContent value="available" className="space-y-6">
            {upcomingTournaments.map(tournament => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament} 
                onApply={() => handleApply(tournament.id)} 
              />
            ))}
            
            {upcomingTournaments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No available tournaments found.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Pending Applications */}
          <TabsContent value="pending" className="space-y-6">
            {pendingTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
            
            {pendingTournaments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending applications.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Assigned Tournaments */}
          <TabsContent value="assigned" className="space-y-6">
            {assignedTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
            
            {assignedTournaments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No assigned tournaments.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Completed Tournaments */}
          <TabsContent value="completed" className="space-y-6">
            {completedTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
            
            {completedTournaments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed tournaments.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Tournament Card Component
function TournamentCard({ 
  tournament, 
  onApply 
}: { 
  tournament: Tournament;
  onApply?: () => void;
}) {
  const router = useRouter();
  
  // Status badge
  const getStatusBadge = () => {
    // Map database statuses to UI display values
    const statusMap: Record<string, { label: string, variant: string, classes: string }> = {
      "DRAFT": { 
        label: "Upcoming", 
        variant: "outline",
        classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      },
      "REGISTRATION_OPEN": { 
        label: "Registration Open", 
        variant: "outline",
        classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      },
      "REGISTRATION_CLOSED": { 
        label: "Registration Closed", 
        variant: "outline",
        classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      },
      "IN_PROGRESS": { 
        label: "Active", 
        variant: "default",
        classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      },
      "COMPLETED": { 
        label: "Completed", 
        variant: "secondary",
        classes: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
      },
      "CANCELLED": { 
        label: "Cancelled", 
        variant: "secondary",
        classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }
    };

    const status = statusMap[tournament.status] || {
      label: tournament.status,
      variant: "outline",
      classes: ""
    };

    return (
      <Badge 
        variant={status.variant as any}
        className={status.classes}
      >
        {status.label}
      </Badge>
    );
  };
  
  // Application status
  const getApplicationBadge = () => {
    if (!tournament.applicationStatus) return null;
    
    switch (tournament.applicationStatus) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Application Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Assigned
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Application Rejected
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Registration status
  const getRegistrationBadge = () => {
    if (tournament.registrationStatus === "OPEN") {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Registration Open
        </Badge>
      );
    }
    
    if (tournament.registrationStatus === "CLOSED") {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          Registration Closed
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        {tournament.registrationStatus}
      </Badge>
    );
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="md:flex">
        {/* Tournament Info */}
        <div className="p-6 flex-1">
          <div className="flex justify-between items-start">
            {/* Tournament Details */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-semibold">{tournament.name}</h3>
                {getStatusBadge()}
                {getApplicationBadge()}
              </div>
              <p className="text-muted-foreground mt-1">
                {tournament.description}
              </p>
            </div>
          </div>
          
          {/* Location and Dates */}
          <div className="flex flex-wrap gap-6 mt-4 text-sm">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{tournament.location}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>
                {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-muted/20 p-3 rounded-md">
              <p className="text-xs text-muted-foreground">Players</p>
              <p className="text-lg font-medium">{tournament.playerCount}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-md">
              <p className="text-xs text-muted-foreground">Referees</p>
              <p className="text-lg font-medium">
                {tournament.refereeCount} / {tournament.refereeNeeded}
              </p>
              {tournament.refereeCount < tournament.refereeNeeded && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {tournament.refereeNeeded - tournament.refereeCount} needed
                </p>
              )}
            </div>
            <div className="bg-muted/20 p-3 rounded-md">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-medium">
                {getRegistrationBadge()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="bg-muted/30 p-6 flex flex-col justify-center space-y-3 md:w-56">
          {tournament.applicationStatus === "ACCEPTED" && (
            <Link href={`/referee/assignments`}>
              <Button variant="default" className="w-full">
                View Assignment
              </Button>
            </Link>
          )}
          
          {tournament.applicationStatus === "PENDING" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-md p-3 text-center">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Application Pending</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Waiting for tournament director response</p>
            </div>
          )}
          
          {tournament.applicationStatus === "NOT_APPLIED" && tournament.status === "UPCOMING" && (
            <>
              {tournament.registrationStatus === "OPEN" ? (
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={onApply}
                >
                  Apply to Referee
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  {tournament.registrationStatus === "INVITE_ONLY" ? "Invite Only" : "Registration Closed"}
                </Button>
              )}
            </>
          )}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push(`/tournaments/${tournament.id}`)}
          >
            Tournament Details
          </Button>
        </div>
      </div>
    </Card>
  );
} 