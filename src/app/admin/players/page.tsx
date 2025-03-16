"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Check,
  X,
  MoreHorizontal,
  User,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define Player interface
interface Player {
  id: string | number;
  name: string;
  skillLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  dominantHand?: "LEFT" | "RIGHT" | "AMBIDEXTROUS";
  isActive: boolean;
  rank?: number;
  tournamentWins?: number;
  imageUrl?: string;
  userId?: string | number;
}

interface NewPlayerData {
  name: string;
  skillLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  dominantHand?: "LEFT" | "RIGHT" | "AMBIDEXTROUS";
}

export default function PlayerManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const { data: session, status } = useSession();

  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewPlayerDialogOpen, setIsNewPlayerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [skillLevelFilter, setSkillLevelFilter] = useState<string | null>(null);
  const [newPlayer, setNewPlayer] = useState<NewPlayerData>({
    name: "",
    skillLevel: "INTERMEDIATE",
    country: "",
    dominantHand: "RIGHT",
  });

  useEffect(() => {
    // Redirect if not authenticated or not an admin
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (
      status === "authenticated" &&
      !["MASTER_ADMIN", "TOURNAMENT_ADMIN"].includes(
        session?.user?.role as string
      )
    ) {
      router.push("/unauthorized");
      return;
    }

    // Only fetch players if authenticated, not loading, not already fetched, and no error
    if (status === "authenticated" && !loading && !dataFetched) {
      const fetchPlayers = async () => {
        try {
          setLoading(true);
          console.log("Fetching players data...");
          
          try {
            // Try the API endpoint
            const response = await fetch("/api/players");

            if (!response.ok) {
              throw new Error("Failed to fetch players");
            }

            const data = await response.json();
            console.log("Players data received:", data);
            
            if (data && Array.isArray(data.players)) {
              setPlayers(data.players);
              setFilteredPlayers(data.players);
            } else if (data && Array.isArray(data)) {
              // Handle case where API returns array directly
              setPlayers(data);
              setFilteredPlayers(data);
            } else {
              console.warn("Invalid players data format:", data);
              setPlayers([]);
              setFilteredPlayers([]);
            }
          } catch (apiError) {
            console.error("API Error fetching players:", apiError);
            setPlayers([]);
            setFilteredPlayers([]);
            setError("Failed to load players. Please try again later.");
          }
        } catch (err: any) {
          console.error("Error in player fetch flow:", err);
          setError(
            err.message || "An error occurred while fetching players"
          );
          setPlayers([]);
          setFilteredPlayers([]);
        } finally {
          setLoading(false);
          setDataFetched(true);
        }
      };
      
      fetchPlayers();
    }
  }, [status, session, router, loading, dataFetched]);

  // Filter players when search term or filter changes
  useEffect(() => {
    if (!players.length) return;

    let result = [...players];

    if (searchTerm) {
      result = result.filter(
        (player) =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (player.country?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    }

    if (skillLevelFilter) {
      result = result.filter((player) => player.skillLevel === skillLevelFilter);
    }

    setFilteredPlayers(result);
  }, [searchTerm, skillLevelFilter, players]);

  const handleAddPlayer = async () => {
    try {
      if (!newPlayer.name.trim()) {
        toast({
          title: "Error",
          description: "Player name is required",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlayer),
      });

      if (!response.ok) {
        throw new Error("Failed to add player");
      }

      const addedPlayer = await response.json();
      setPlayers((prev) => [...prev, addedPlayer]);
      setFilteredPlayers((prev) => [...prev, addedPlayer]);
      
      toast({
        title: "Success",
        description: "Player added successfully",
      });
      
      setIsNewPlayerDialogOpen(false);
      setNewPlayer({
        name: "",
        skillLevel: "INTERMEDIATE",
        country: "",
        dominantHand: "RIGHT",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add player",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      const response = await fetch(`/api/players/${playerToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete player");
      }

      setPlayers((prev) => prev.filter((p) => p.id !== playerToDelete.id));
      setFilteredPlayers((prev) => prev.filter((p) => p.id !== playerToDelete.id));
      
      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      setPlayerToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete player",
        variant: "destructive",
      });
    }
  };

  const confirmDeletePlayer = (player: Player) => {
    setPlayerToDelete(player);
    setIsDeleteDialogOpen(true);
  };

  if (loading && players.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a1e0]"></div>
          <p className="mt-4 text-gray-500">Loading players...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#00a1e0]">
            Player Management
          </h1>
          <p className="text-gray-600 mt-1">
            Add, edit, and manage player profiles
          </p>
        </div>

        <Button
          className="mt-4 md:mt-0 bg-[#00a1e0] hover:bg-[#0072a3]"
          onClick={() => setIsNewPlayerDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>View and manage all players</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name or country..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Select
                value={skillLevelFilter || ""}
                onValueChange={(value) => setSkillLevelFilter(value || null)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Skill Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Skill Levels</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Skill Level</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Dominant Hand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        {player.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            player.skillLevel === "BEGINNER"
                              ? "bg-green-100 text-green-800"
                              : player.skillLevel === "INTERMEDIATE"
                              ? "bg-blue-100 text-blue-800"
                              : player.skillLevel === "ADVANCED"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {player.skillLevel?.toLowerCase() || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{player.country || "N/A"}</TableCell>
                      <TableCell>
                        {player.dominantHand || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={player.isActive ? "default" : "secondary"}
                          className={
                            player.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {player.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
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
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/players/${player.id}`)
                              }
                            >
                              <User className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/players/edit/${player.id}`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Player
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => confirmDeletePlayer(player)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Player
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-gray-500"
                    >
                      {searchTerm || skillLevelFilter
                        ? "No players found matching your search criteria."
                        : "No players added yet. Click 'Add Player' to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Player Dialog */}
      <Dialog open={isNewPlayerDialogOpen} onOpenChange={setIsNewPlayerDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Enter the player details below to add them to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Player Name</Label>
              <Input
                id="name"
                value={newPlayer.name}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, name: e.target.value })
                }
                placeholder="Enter player's name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={newPlayer.country || ""}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, country: e.target.value })
                }
                placeholder="Enter player's country"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skillLevel">Skill Level</Label>
              <Select
                value={newPlayer.skillLevel || "INTERMEDIATE"}
                onValueChange={(value) =>
                  setNewPlayer({
                    ...newPlayer,
                    skillLevel: value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL",
                  })
                }
              >
                <SelectTrigger id="skillLevel">
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dominantHand">Dominant Hand</Label>
              <Select
                value={newPlayer.dominantHand || "RIGHT"}
                onValueChange={(value) =>
                  setNewPlayer({
                    ...newPlayer,
                    dominantHand: value as "LEFT" | "RIGHT" | "AMBIDEXTROUS",
                  })
                }
              >
                <SelectTrigger id="dominantHand">
                  <SelectValue placeholder="Select dominant hand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RIGHT">Right</SelectItem>
                  <SelectItem value="LEFT">Left</SelectItem>
                  <SelectItem value="AMBIDEXTROUS">Ambidextrous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewPlayerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPlayer}>Add Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {playerToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlayer}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 