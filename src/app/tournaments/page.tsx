"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Users, ArrowRight, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Tournament {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  maxPlayers: number;
  registeredPlayers: number;
  totalContests: number;
  registrationFee: number;
  imageUrl?: string;
}

export default function TournamentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        
        // In a real application, this would be an actual API call
        // const response = await fetch("/api/tournaments");
        // if (!response.ok) throw new Error("Failed to fetch tournaments");
        // const data = await response.json();
        
        // Example data for demonstration
        const mockData: Tournament[] = [
          {
            id: 1,
            name: "Summer Grand Slam",
            description: "The premiere pickleball tournament of the summer season",
            location: "Miami, FL",
            startDate: "2023-10-05",
            endDate: "2023-10-10",
            status: "UPCOMING",
            maxPlayers: 64,
            registeredPlayers: 42,
            totalContests: 3,
            registrationFee: 75,
            imageUrl: "/tournaments/summer-slam.jpg"
          },
          {
            id: 2,
            name: "Masters Invitational",
            description: "An exclusive tournament for the highest skilled players",
            location: "Las Vegas, NV",
            startDate: "2023-11-12",
            endDate: "2023-11-18",
            status: "UPCOMING",
            maxPlayers: 32,
            registeredPlayers: 28,
            totalContests: 2,
            registrationFee: 125,
            imageUrl: "/tournaments/masters.jpg"
          },
          {
            id: 3,
            name: "Winter Classic",
            description: "The annual winter pickleball championship",
            location: "Orlando, FL",
            startDate: "2023-12-08",
            endDate: "2023-12-12",
            status: "UPCOMING",
            maxPlayers: 48,
            registeredPlayers: 31,
            totalContests: 2,
            registrationFee: 85,
            imageUrl: "/tournaments/winter-classic.jpg"
          },
          {
            id: 4,
            name: "Regional Championships",
            description: "The best players from each region competing for the title",
            location: "Chicago, IL",
            startDate: "2023-09-15",
            endDate: "2023-09-20",
            status: "IN_PROGRESS",
            maxPlayers: 56,
            registeredPlayers: 56,
            totalContests: 4,
            registrationFee: 95,
            imageUrl: "/tournaments/regional.jpg"
          },
          {
            id: 5,
            name: "City Open",
            description: "Open tournament for all skill levels",
            location: "Austin, TX",
            startDate: "2023-08-05",
            endDate: "2023-08-10",
            status: "COMPLETED",
            maxPlayers: 80,
            registeredPlayers: 72,
            totalContests: 5,
            registrationFee: 65,
            imageUrl: "/tournaments/city-open.jpg"
          }
        ];
        
        // Add a small delay to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setTournaments(mockData);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Filter and search tournaments
  const filteredTournaments = tournaments
    .filter(tournament => {
      // Apply status filter if selected
      if (filter && tournament.status !== filter) return false;
      
      // Apply search term
      if (searchTerm && !tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !tournament.location.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

  // Handle registering for a tournament
  const handleRegister = (tournamentId: number) => {
    if (!session) {
      // If not logged in, redirect to login page
      router.push(`/login?redirect=/tournaments/${tournamentId}`);
      return;
    }
    
    // If logged in, go to tournament registration page
    router.push(`/tournaments/${tournamentId}/register`);
  };

  // Handle viewing tournament details
  const handleViewTournament = (tournamentId: number) => {
    router.push(`/tournaments/${tournamentId}`);
  };

  // Handle viewing fantasy contests for a tournament
  const handleViewContests = (tournamentId: number) => {
    router.push(`/tournaments/${tournamentId}/contests`);
  };

  // Get badge variant based on tournament status
  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Upcoming</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-800/30">
          <p className="font-bold">Error loading tournaments</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          Pickleball Tournaments
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Browse and register for upcoming tournaments, or participate in fantasy contests for tournaments in progress.
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
            variant={filter === "IN_PROGRESS" ? "default" : "outline"}
            size="sm" 
            onClick={() => setFilter("IN_PROGRESS")}
          >
            In Progress
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
      
      {/* Tournament cards */}
      {filteredTournaments.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No tournaments found</h3>
          <p className="text-muted-foreground">
            No tournaments match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-muted relative">
                {/* We would use an actual image here in a real app */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/30 flex items-center justify-center">
                  <Trophy className="h-12 w-12 text-white/80" />
                </div>
                <div className="absolute top-2 right-2">
                  {getStatusBadge(tournament.status)}
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="line-clamp-1">{tournament.name}</CardTitle>
                <CardDescription className="line-clamp-2">{tournament.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3 flex-grow">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{tournament.location}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {tournament.registeredPlayers} / {tournament.maxPlayers} players registered
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Trophy className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{tournament.totalContests} fantasy contests available</span>
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-4">
                {tournament.status === "UPCOMING" ? (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewTournament(tournament.id)}
                    >
                      Details
                    </Button>
                    <Button 
                      onClick={() => handleRegister(tournament.id)}
                    >
                      Register
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewTournament(tournament.id)}
                    >
                      Details
                    </Button>
                    <Button 
                      onClick={() => handleViewContests(tournament.id)}
                    >
                      Join Contests
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Upcoming featured tournament */}
      {tournaments.some(t => t.status === "UPCOMING") && (
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-bold mb-6">Featured Tournament</h2>
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800/30">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mb-2">
                    Summer Grand Slam
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    The premiere pickleball tournament of the summer season. Join now to compete with top players from around the country.
                  </p>
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Dates</p>
                      <p className="font-medium">Oct 5-10, 2023</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">Miami, FL</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entry Fee</p>
                      <p className="font-medium">$75</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleRegister(1)}>
                      Register Now
                    </Button>
                    <Button variant="outline" onClick={() => handleViewTournament(1)}>
                      Learn More
                    </Button>
                  </div>
                </div>
                <div className="hidden md:flex justify-center items-center">
                  <Trophy className="h-32 w-32 text-indigo-200 dark:text-indigo-900/50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Tournament FAQ */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Tournament Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>How to Register</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>1. Create an account or sign in</p>
              <p>2. Browse upcoming tournaments</p>
              <p>3. Click "Register" on your chosen tournament</p>
              <p>4. Complete payment and submit your registration</p>
              <p>5. You'll receive a confirmation email with details</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push("/tournaments/registration-guide")}>
                Registration Guide
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Fantasy Contests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Join fantasy contests to make your tournament experience even more exciting:</p>
              <p>• Select your dream team of players</p>
              <p>• Earn points based on their performance</p>
              <p>• Compete against other fantasy managers</p>
              <p>• Win prizes based on your team's rankings</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push("/fantasy/how-to-play")}>
                Fantasy Guide
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 