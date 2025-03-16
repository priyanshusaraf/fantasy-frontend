"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  Clock, 
  Edit, 
  Eye, 
  FileEdit, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  Trophy,
  UserPlus,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvitePlayersDialog from "@/components/tournaments/invitations/InvitePlayersDialog";
import ActiveInvitationsTable from "@/components/tournaments/invitations/ActiveInvitationsTable";
import JoinRequestsTable from "@/components/tournaments/invitations/JoinRequestsTable";
import { toast } from "@/components/ui/use-toast";

// Define tournament interface
interface Tournament {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  location: string;
  status: string;
  playerCount?: number;
  prizeMoney?: number | string;
  registrationOpen?: boolean;
  description?: string;
  [key: string]: any; // Allow for additional properties
}

export default function TournamentManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentDetailsOpen, setTournamentDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is an admin
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      !["MASTER_ADMIN", "TOURNAMENT_ADMIN"].includes(
        session?.user?.role as string
      )
    ) {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  // Fetch tournaments from API
  React.useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        console.log("Fetching tournaments...");
        
        // Token-based auth (for custom auth flow)
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers: HeadersInit = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/tournaments', {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        
        const data = await response.json();
        console.log("Tournaments data received:", data);
        
        if (data && Array.isArray(data.tournaments)) {
          setTournaments(data.tournaments);
        } else if (data && Array.isArray(data)) {
          // Handle case where API returns array directly
          setTournaments(data);
        } else {
          console.warn("Invalid tournaments data format:", data);
          setTournaments([]);
        }
      } catch (err: any) {
        console.error('Error fetching tournaments:', err);
        setError(err.message || 'An error occurred while fetching tournaments');
        setTournaments([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchTournaments();
    }
  }, [status]);

  // If still checking authentication, show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading tournament management...</p>
        </div>
      </div>
    );
  }

  // Error handling
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <h3 className="font-semibold">Error loading tournaments</h3>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Filter tournaments based on search query and status filter
  const filteredTournaments = tournaments.filter((tournament: Tournament) => {
    const matchesSearch = 
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tournament.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || tournament.status === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Format currency for display
  const formatCurrency = (amount: number | string): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericAmount || 0);
  };

  // Handle tournament actions
  const handleViewTournament = (tournament: Tournament): void => {
    setSelectedTournament(tournament);
    setTournamentDetailsOpen(true);
    // Default to overview tab when opening tournament details
    setActiveTab("overview");
  };

  const handleEditTournament = (tournament: Tournament): void => {
    setSelectedTournament(tournament);
    setTournamentDetailsOpen(true);
  };

  const handleDeleteTournament = async (tournament: Tournament): Promise<void> => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tournament');
      }
      
      // Remove tournament from local state
      setTournaments(prevTournaments => 
        prevTournaments.filter(t => t.id !== tournament.id)
      );
      
      toast({
        title: "Tournament deleted",
        description: `${tournament.name} has been deleted successfully.`,
      });
      
      setDeleteConfirmOpen(false);
    } catch (error: any) {
      console.error('Error deleting tournament:', error);
      toast({
        title: "Error",
        description: "Failed to delete tournament. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleManagePlayers = (tournament: Tournament): void => {
    // Redirect to player management page with the tournament ID
    router.push(`/admin/player-management?tournamentId=${tournament.id}`);
  };

  const createTournament = () => {
    // Navigate to the create-tournament page instead of opening a dialog
    console.log("Creating tournament - navigating to /admin/tournaments/create");
    router.push("/admin/tournaments/create");
  };

  // Get badge color based on tournament status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-500 dark:border-green-800/30">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-500 dark:border-blue-800/30">Upcoming</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Tournament Management</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage pickleball tournaments across the platform.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Tournaments</CardTitle>
          <CardDescription>
            Manage all tournaments and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tournaments..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => createTournament()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tournament
              </Button>
              <a href="/admin/tournaments/create" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md">
                Direct Link
              </a>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament Name</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Prize Pool</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tournaments found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTournaments.map((tournament) => (
                    <TableRow key={tournament.id}>
                      <TableCell className="font-medium">{tournament.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tournament.location}</TableCell>
                      <TableCell>{getStatusBadge(tournament.status)}</TableCell>
                      <TableCell>{tournament.playerCount}</TableCell>
                      <TableCell>{formatCurrency(tournament.prizeMoney)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewTournament(tournament)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTournament(tournament)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Tournament
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManagePlayers(tournament)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Players
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteTournament(tournament)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Tournament
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span>Tournament Statistics</span>
            </CardTitle>
            <CardDescription>
              Overview of tournament data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Tournaments</div>
                  <div className="text-2xl font-bold">{tournaments.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Prize Money</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(tournaments.reduce((sum, t) => sum + parseFloat(t.prizeMoney || 0), 0))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Tournament Status</div>
                
                {/* Active Tournaments */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-green-500" />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {tournaments.filter(t => t.status === "IN_PROGRESS" || t.status === "active").length}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tournaments.length ? Math.round((tournaments.filter(t => t.status === "IN_PROGRESS" || t.status === "active").length / tournaments.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={tournaments.length ? Math.round((tournaments.filter(t => t.status === "IN_PROGRESS" || t.status === "active").length / tournaments.length) * 100) : 0} 
                    className="bg-green-500" 
                  />
                </div>

                {/* Upcoming Tournaments */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Upcoming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {tournaments.filter(t => t.status === "REGISTRATION_OPEN" || t.status === "REGISTRATION_CLOSED" || t.status === "upcoming").length}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tournaments.length ? Math.round((tournaments.filter(t => t.status === "REGISTRATION_OPEN" || t.status === "REGISTRATION_CLOSED" || t.status === "upcoming").length / tournaments.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={tournaments.length ? Math.round((tournaments.filter(t => t.status === "REGISTRATION_OPEN" || t.status === "REGISTRATION_CLOSED" || t.status === "upcoming").length / tournaments.length) * 100) : 0} 
                    className="bg-blue-500" 
                  />
                </div>

                {/* Completed Tournaments */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-gray-500" />
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {tournaments.filter(t => t.status === "COMPLETED" || t.status === "completed").length}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tournaments.length ? Math.round((tournaments.filter(t => t.status === "COMPLETED" || t.status === "completed").length / tournaments.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={tournaments.length ? Math.round((tournaments.filter(t => t.status === "COMPLETED" || t.status === "completed").length / tournaments.length) * 100) : 0} 
                    className="bg-gray-500" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-primary" />
              <span>Tournament Management</span>
            </CardTitle>
            <CardDescription>
              Quick actions and tournament tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Button className="justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Tournament
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Tournament Events
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Filter className="mr-2 h-4 w-4" />
                Tournament Bracket Generator
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Eye className="mr-2 h-4 w-4" />
                Preview Tournament Pages
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Upcoming Tournaments</h3>
              <div className="space-y-3">
                {tournaments
                  .filter(t => t.status === "upcoming")
                  .slice(0, 3)
                  .map(tournament => (
                    <div key={tournament.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div>
                        <div className="font-medium">{tournament.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(tournament.startDate)} • {tournament.location}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleViewTournament(tournament)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Details Dialog */}
      <Dialog open={tournamentDetailsOpen} onOpenChange={setTournamentDetailsOpen}>
        <DialogContent className="max-w-4xl">
          {selectedTournament && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex justify-between items-center">
                  <span>{selectedTournament.name}</span>
                  {getStatusBadge(selectedTournament.status)}
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedTournament.startDate), "PPP")} to {format(new Date(selectedTournament.endDate), "PPP")} • {selectedTournament.location}
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="participants">Participants</TabsTrigger>
                  <TabsTrigger value="invitations">Invitations</TabsTrigger>
                  <TabsTrigger value="joinRequests">Join Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Existing tournament overview content */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Start Date</h4>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(new Date(selectedTournament.startDate), "PPP")}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">End Date</h4>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(new Date(selectedTournament.endDate), "PPP")}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Location</h4>
                      <p>{selectedTournament.location}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Prize Money</h4>
                      <p>{formatCurrency(selectedTournament.prizeMoney)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Player Count</h4>
                      <p className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        {selectedTournament.playerCount} players
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                      <p>{getStatusBadge(selectedTournament.status)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Tournament Progress</h4>
                    <Progress value={selectedTournament.status === "active" ? 45 : selectedTournament.status === "completed" ? 100 : 0} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedTournament.status === "upcoming" 
                        ? "Tournament has not started yet" 
                        : selectedTournament.status === "active" 
                        ? "Tournament is in progress - Round 3 of 7" 
                        : "Tournament completed"}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="participants" className="space-y-4">
                  {/* Participants list would go here */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Registered Players</h3>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Player
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Mock data for example */}
                      <TableRow>
                        <TableCell>John Doe</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Confirmed
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date("2023-08-15"), "PPP")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Jane Smith</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Confirmed
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date("2023-08-16"), "PPP")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="invitations" className="space-y-4">
                  {/* Invitation management */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Tournament Invitations</h3>
                    <InvitePlayersDialog 
                      tournamentId={parseInt(selectedTournament.id)} 
                      onInviteSent={() => {
                        // In a real app, refresh invitations data
                      }} 
                    />
                  </div>
                  <div className="mt-4">
                    <ActiveInvitationsTable 
                      tournamentId={parseInt(selectedTournament.id)} 
                      onInvitationCancelled={() => {
                        // In a real app, refresh invitations data
                      }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="joinRequests" className="space-y-4">
                  {/* Join requests management */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Join Requests</h3>
                    <JoinRequestsTable 
                      tournamentId={parseInt(selectedTournament.id)}
                      onRequestUpdated={() => {
                        // In a real app, refresh join requests data
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setTournamentDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setTournamentDetailsOpen(false);
                    handleEditTournament(selectedTournament);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Tournament
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Tournament Dialog */}
      {selectedTournament && (
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Delete Tournament</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this tournament? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 border rounded-md bg-muted/50">
                <div className="font-medium">{selectedTournament.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(selectedTournament.startDate)} - {formatDate(selectedTournament.endDate)}
                </div>
                <div className="text-sm mt-1">
                  {getStatusBadge(selectedTournament.status)}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive">Delete Tournament</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 