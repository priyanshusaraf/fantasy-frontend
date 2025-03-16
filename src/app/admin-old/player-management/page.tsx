"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  AlertCircle,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Check,
  X,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PlayerSearch } from "@/components/player/PlayerSearch";
import { NewPlayerDialog } from "@/components/player/NewPlayerDialog";
import { PlayerCard } from "@/components/player/PlayerCard";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Player {
  id: number;
  name: string;
  skillLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  dominantHand?: "LEFT" | "RIGHT" | "AMBIDEXTROUS";
  isActive: boolean;
  rank?: number;
  tournamentWins?: number;
  imageUrl?: string;
  userId?: number;
}

interface NewPlayerData {
  name: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  dominantHand: "LEFT" | "RIGHT" | "AMBIDEXTROUS";
}

export default function PlayerManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const { isAuthenticated, user } = useAuth();
  const { isAdmin } = useRoleAccess();

  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewPlayerDialogOpen, setIsNewPlayerDialogOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState<NewPlayerData>({
    name: "",
    skillLevel: "INTERMEDIATE",
    country: "",
    dominantHand: "RIGHT",
  });
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    tournamentId ? "tournament" : "all"
  );
  const [skillLevelFilter, setSkillLevelFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Redirect if not authenticated or not an admin
    if (isAuthenticated && !isAdmin()) {
      router.push("/");
      return;
    }

    const fetchPlayers = async () => {
      try {
        setLoading(true);

        // Fetch all players
        const response = await fetch("/api/players?limit=100", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }

        const data = await response.json();
        setPlayers(data.players);
        setFilteredPlayers(data.players);
        setTotalPages(data.meta.totalPages);

        // If tournament ID is provided, fetch tournament players
        if (tournamentId) {
          const tournamentResponse = await fetch(
            `/api/tournaments/${tournamentId}/players`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (tournamentResponse.ok) {
            const tournamentData = await tournamentResponse.json();
            setTournamentPlayers(tournamentData.players);
            setSelectedPlayers(tournamentData.players);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPlayers();
    }
  }, [tournamentId, isAuthenticated, isAdmin, router]);

  // Filter players when search term or filter changes
  useEffect(() => {
    filterPlayers();
  }, [searchTerm, skillLevelFilter, players]);

  const filterPlayers = () => {
    let filtered = [...players];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (player) =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (player.country &&
            player.country.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply skill level filter
    if (skillLevelFilter) {
      filtered = filtered.filter(
        (player) => player.skillLevel === skillLevelFilter
      );
    }

    setFilteredPlayers(filtered);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleSkillLevelFilterChange = (level: string | null) => {
    setSkillLevelFilter(level === skillLevelFilter ? null : level);
  };

  const handleSelectPlayer = (player: Player) => {
    if (!tournamentId) return;

    if (!selectedPlayers.some((p) => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleRemovePlayer = (playerId: number) => {
    if (!tournamentId) return;

    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
  };

  const handleCreatePlayer = async () => {
    if (!newPlayer.name.trim()) {
      toast.error("Player name is required");
      return;
    }

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newPlayer),
      });

      if (!response.ok) {
        throw new Error("Failed to create player");
      }

      const createdPlayer = await response.json();

      // Add to players list
      setPlayers([...players, createdPlayer]);

      // Add to selected players if in tournament context
      if (tournamentId) {
        setSelectedPlayers([...selectedPlayers, createdPlayer]);
      }

      // Reset form and close dialog
      setNewPlayer({
        name: "",
        skillLevel: "INTERMEDIATE",
        country: "",
        dominantHand: "RIGHT",
      });
      setIsNewPlayerDialogOpen(false);

      toast.success("Player created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create player"
      );
    }
  };

  const handleDeletePlayer = (player: Player) => {
    setPlayerToDelete(player);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      const response = await fetch(`/api/players/${playerToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete player");
      }

      // Remove from players list
      setPlayers(players.filter((p) => p.id !== playerToDelete.id));

      // Remove from selected players if in tournament context
      if (tournamentId) {
        setSelectedPlayers(
          selectedPlayers.filter((p) => p.id !== playerToDelete.id)
        );
      }

      toast.success("Player deleted successfully");
      setIsDeleteDialogOpen(false);
      setPlayerToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete player"
      );
    }
  };

  const handleEditPlayer = (player: Player) => {
    router.push(`/admin/players/${player.id}/edit`);
  };

  const handleSaveSelectedPlayers = async () => {
    if (!tournamentId) return;

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          playerIds: selectedPlayers.map((p) => p.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tournament players");
      }

      toast.success("Tournament players updated successfully");

      // Refresh tournament players
      const tournamentResponse = await fetch(
        `/api/tournaments/${tournamentId}/players`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        setTournamentPlayers(tournamentData.players);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update tournament players"
      );
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Fetch new page of players
    fetchPlayersByPage(page);
  };

  const fetchPlayersByPage = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/players?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch players");
      }

      const data = await response.json();
      setPlayers(data.players);
      setFilteredPlayers(data.players);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
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
            {tournamentId ? "Tournament Players" : "Player Management"}
          </h1>
          <p className="text-gray-600 mt-1">
            {tournamentId
              ? "Manage players for this tournament"
              : "View and manage all players"}
          </p>
        </div>

        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => setIsNewPlayerDialogOpen(true)}
            className="bg-[#00a1e0] hover:bg-[#0072a3]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Player
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        {tournamentId && (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tournament">Tournament Players</TabsTrigger>
            <TabsTrigger value="all">All Players</TabsTrigger>
          </TabsList>
        )}

        {tournamentId && (
          <TabsContent value="tournament" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Players</CardTitle>
                <CardDescription>
                  Players currently assigned to this tournament
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPlayers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedPlayers.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        isSelected={true}
                        showRemoveButton={true}
                        onRemove={() => handleRemovePlayer(player.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-4 text-gray-500">
                      No players added to this tournament yet
                    </p>
                    <p className="text-sm text-gray-400">
                      Select players from the "All Players" tab
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveSelectedPlayers}
                  disabled={selectedPlayers.length === 0}
                >
                  Save Tournament Players
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="all" className={tournamentId ? "mt-4" : ""}>
          <Card>
            <CardHeader>
              <CardTitle>{tournamentId ? "All Players" : "Players"}</CardTitle>
              <CardDescription>
                {tournamentId
                  ? "Select players to add to your tournament"
                  : "Manage all players in the system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search players..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant={!skillLevelFilter ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleSkillLevelFilterChange(null)}
                  >
                    All Levels
                  </Badge>
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"].map(
                    (level) => (
                      <Badge
                        key={level}
                        variant={
                          skillLevelFilter === level ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => handleSkillLevelFilterChange(level)}
                      >
                        {level.toLowerCase()}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              {filteredPlayers.length > 0 ? (
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
                      {filteredPlayers.map((player) => (
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
                              variant={
                                player.isActive ? "default" : "destructive"
                              }
                            >
                              {player.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {tournamentId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSelectPlayer(player)}
                                  disabled={selectedPlayers.some(
                                    (p) => p.id === player.id
                                  )}
                                >
                                  {selectedPlayers.some(
                                    (p) => p.id === player.id
                                  )
                                    ? "Added"
                                    : "Add"}
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Filter className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditPlayer(player)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePlayer(player)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-4 text-gray-500">No players found</p>
                  <p className="text-sm text-gray-400">
                    Try a different search term or filter
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={
                              page === currentPage ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Player Dialog */}
      <NewPlayerDialog
        open={isNewPlayerDialogOpen}
        onOpenChange={setIsNewPlayerDialogOpen}
        playerData={newPlayer}
        onPlayerDataChange={setNewPlayer}
        onSubmit={handleCreatePlayer}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {playerToDelete?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePlayer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
