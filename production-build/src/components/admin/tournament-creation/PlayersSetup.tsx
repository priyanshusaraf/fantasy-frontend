"use client";

import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { 
  Plus, 
  Trash, 
  Link, 
  Search, 
  UserPlus, 
  Users, 
  Loader2, 
  Copy, 
  CheckCircle2, 
  Mail
} from "lucide-react";

// UI Components
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Define types for players and teams
type Player = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  skillLevel?: string;
  teamId?: string;
};

type Team = {
  id?: string;
  name: string;
  players: Player[];
  captainId?: string;
};

export default function PlayersSetup() {
  const { control, watch, setValue, getValues } = useFormContext();
  const { toast } = useToast();
  
  // Get relevant values from form
  const isTeamBased = watch("players.isTeamBased");
  const registrationMode = watch("players.registrationMode");
  
  // Local state for component
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);
  
  // Get existing values
  const players = watch("players.individuals") || [];
  const teams = watch("players.teams") || [];
  
  // Update form when registration mode changes
  useEffect(() => {
    if (registrationMode === "OPEN") {
      // If open registration, reset player lists as they'll register themselves
      setValue("players.individuals", []);
      setValue("players.teams", []);
    }
  }, [registrationMode, setValue]);
  
  // Handle searching for existing players
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // This would be a real API call in production
      // For now, simulate with some delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock search results
      const mockResults = [
        { id: "p1", name: "John Doe", email: "john@example.com", skillLevel: "PROFESSIONAL" },
        { id: "p2", name: "Jane Smith", email: "jane@example.com", skillLevel: "ADVANCED" },
        { id: "p3", name: "Mike Johnson", email: "mike@example.com", skillLevel: "INTERMEDIATE" },
      ].filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error("Error searching players:", error);
      toast({
        title: "Search Failed",
        description: "Could not search for players. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle adding existing player
  const handleAddExistingPlayer = (player: Player) => {
    const currentPlayers = getValues("players.individuals") || [];
    
    // Check if player already added
    if (currentPlayers.some(p => p.id === player.id)) {
      toast({
        title: "Player Already Added",
        description: `${player.name} is already in the tournament.`,
        variant: "destructive",
      });
      return;
    }
    
    setValue("players.individuals", [...currentPlayers, player]);
    toast({
      title: "Player Added",
      description: `${player.name} has been added to the tournament.`,
    });
  };
  
  // Handle adding new player
  const handleAddNewPlayer = () => {
    if (!newPlayerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Player name is required.",
        variant: "destructive",
      });
      return;
    }
    
    const currentPlayers = getValues("players.individuals") || [];
    const newPlayer: Player = {
      name: newPlayerName,
      email: newPlayerEmail,
    };
    
    setValue("players.individuals", [...currentPlayers, newPlayer]);
    
    // Reset fields and close dialog
    setNewPlayerName("");
    setNewPlayerEmail("");
    setShowAddPlayerDialog(false);
    
    toast({
      title: "Player Added",
      description: `${newPlayerName} has been added to the tournament.`,
    });
  };
  
  // Handle adding new team
  const handleAddNewTeam = () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Missing Information",
        description: "Team name is required.",
        variant: "destructive",
      });
      return;
    }
    
    const currentTeams = getValues("players.teams") || [];
    const newTeam: Team = {
      name: newTeamName,
      players: [],
    };
    
    setValue("players.teams", [...currentTeams, newTeam]);
    
    // Reset field and close dialog
    setNewTeamName("");
    setShowAddTeamDialog(false);
    
    toast({
      title: "Team Added",
      description: `${newTeamName} has been added to the tournament.`,
    });
  };
  
  // Handle removing player
  const handleRemovePlayer = (index: number) => {
    const currentPlayers = [...getValues("players.individuals")];
    currentPlayers.splice(index, 1);
    setValue("players.individuals", currentPlayers);
    
    toast({
      title: "Player Removed",
      description: "Player has been removed from the tournament.",
    });
  };
  
  // Handle removing team
  const handleRemoveTeam = (index: number) => {
    const currentTeams = [...getValues("players.teams")];
    currentTeams.splice(index, 1);
    setValue("players.teams", currentTeams);
    
    toast({
      title: "Team Removed",
      description: "Team has been removed from the tournament.",
    });
  };
  
  // Handle adding player to team
  const handleAddPlayerToTeam = (teamIndex: number, player: Player) => {
    const currentTeams = [...getValues("players.teams")];
    const team = currentTeams[teamIndex];
    
    // Check if player already in team
    if (team.players.some(p => p.id === player.id)) {
      toast({
        title: "Already in Team",
        description: `${player.name} is already in this team.`,
        variant: "destructive",
      });
      return;
    }
    
    team.players.push({...player});
    setValue("players.teams", currentTeams);
    
    toast({
      title: "Player Added to Team",
      description: `${player.name} added to ${team.name}.`,
    });
  };
  
  // Handle removing player from team
  const handleRemovePlayerFromTeam = (teamIndex: number, playerIndex: number) => {
    const currentTeams = [...getValues("players.teams")];
    const team = currentTeams[teamIndex];
    
    team.players.splice(playerIndex, 1);
    setValue("players.teams", currentTeams);
    
    toast({
      title: "Player Removed from Team",
      description: `Player removed from ${team.name}.`,
    });
  };
  
  // Generate invite link
  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    
    try {
      // This would be a real API call in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock invite link
      const tournamentId = "t123456";
      const mockInviteLink = `https://matchup.com/join-tournament/${tournamentId}?code=${Math.random().toString(36).substring(2, 10)}`;
      
      setInviteLink(mockInviteLink);
    } catch (error) {
      console.error("Error generating invite:", error);
      toast({
        title: "Invite Generation Failed",
        description: "Could not generate invite link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInvite(false);
    }
  };
  
  // Copy invite link to clipboard
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    
    setTimeout(() => {
      setInviteCopied(false);
    }, 3000);
    
    toast({
      title: "Copied to Clipboard",
      description: "Invite link has been copied to clipboard.",
    });
  };
  
  // Send invite via email
  const handleSendInvite = async () => {
    toast({
      title: "Invitation Sent",
      description: "Tournament invitation has been sent via email.",
    });
  };
  
  return (
    <div className="space-y-8">
      {/* Tournament type selection */}
      <FormField
        control={control}
        name="players.isTeamBased"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Tournament Type</FormLabel>
            <FormControl>
              <div className="flex flex-col space-y-4">
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === "team")}
                  value={field.value ? "team" : "individual"}
                  className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2"
                >
                  <div className="flex items-center space-x-2 rounded-md border p-4">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual" className="flex flex-col cursor-pointer">
                      <span className="font-medium">Individual Players</span>
                      <span className="text-sm text-muted-foreground">
                        Players compete individually
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-4">
                    <RadioGroupItem value="team" id="team" />
                    <Label htmlFor="team" className="flex flex-col cursor-pointer">
                      <span className="font-medium">Team-Based</span>
                      <span className="text-sm text-muted-foreground">
                        Players compete as teams
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </FormControl>
            <FormDescription>
              Choose whether players will compete individually or as teams
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Registration mode */}
      <FormField
        control={control}
        name="players.registrationMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Registration Mode</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select registration mode" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ADMIN_ONLY">Admin Only (You add all players)</SelectItem>
                <SelectItem value="INVITATION">By Invitation (Generate invite links)</SelectItem>
                <SelectItem value="OPEN">Open Registration (Anyone can join)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              How participants will be added to the tournament
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Content based on registration mode */}
      {registrationMode !== "OPEN" && (
        <>
          {!isTeamBased ? (
            /* Individual players section */
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Individual Players</CardTitle>
                  <CardDescription>
                    Add players to your tournament
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddPlayerDialog(true)} className="flex items-center gap-1">
                    <UserPlus className="h-4 w-4" />
                    <span>Add Player</span>
                  </Button>
                  
                  {registrationMode === "INVITATION" && (
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateInvite}
                      disabled={isGeneratingInvite}
                    >
                      {isGeneratingInvite ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Link className="mr-2 h-4 w-4" />
                          Generate Invite
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Search existing players */}
                <div className="mb-6 flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search existing players..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    variant="secondary"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2">Search Results</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Skill Level</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((player) => (
                          <TableRow key={player.id}>
                            <TableCell>{player.name}</TableCell>
                            <TableCell>{player.email}</TableCell>
                            <TableCell>{player.skillLevel}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                onClick={() => handleAddExistingPlayer(player)}
                              >
                                Add
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* Invite link (if generated) */}
                {inviteLink && (
                  <div className="mb-6 p-4 border rounded-md bg-muted">
                    <h3 className="text-sm font-medium mb-2">Invitation Link</h3>
                    <div className="flex gap-2 items-center">
                      <Input 
                        value={inviteLink} 
                        readOnly 
                        className="flex-1"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={handleCopyInvite}
                      >
                        {inviteCopied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleSendInvite}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this link with players so they can join the tournament.
                    </p>
                  </div>
                )}
                
                {/* Current players list */}
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Current Players ({players.length})
                  </h3>
                  
                  {players.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-muted-foreground">No players added yet</p>
                      <Button 
                        variant="link" 
                        onClick={() => setShowAddPlayerDialog(true)}
                        className="mt-2"
                      >
                        Add your first player
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.map((player, index) => (
                          <TableRow key={player.id || index}>
                            <TableCell>{player.name}</TableCell>
                            <TableCell>{player.email || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">Pending</Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleRemovePlayer(index)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Team-based section */
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>
                    Add teams and assign players
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddTeamDialog(true)} className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Add Team</span>
                  </Button>
                  
                  {registrationMode === "INVITATION" && (
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateInvite}
                      disabled={isGeneratingInvite}
                    >
                      {isGeneratingInvite ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Link className="mr-2 h-4 w-4" />
                          Generate Invite
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Invite link (if generated) */}
                {inviteLink && (
                  <div className="mb-6 p-4 border rounded-md bg-muted">
                    <h3 className="text-sm font-medium mb-2">Invitation Link</h3>
                    <div className="flex gap-2 items-center">
                      <Input 
                        value={inviteLink} 
                        readOnly 
                        className="flex-1"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={handleCopyInvite}
                      >
                        {inviteCopied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleSendInvite}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this link with team captains so they can register their teams.
                    </p>
                  </div>
                )}
                
                {/* Current teams list */}
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Current Teams ({teams.length})
                  </h3>
                  
                  {teams.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-muted-foreground">No teams added yet</p>
                      <Button 
                        variant="link" 
                        onClick={() => setShowAddTeamDialog(true)}
                        className="mt-2"
                      >
                        Add your first team
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teams.map((team, teamIndex) => (
                        <Card key={team.id || teamIndex} className="overflow-hidden">
                          <CardHeader className="bg-muted py-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{team.name}</CardTitle>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => handleRemoveTeam(teamIndex)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium">Team Players</h4>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Player
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Add Player to {team.name}</DialogTitle>
                                      <DialogDescription>
                                        Search for existing players or create a new one.
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-4 py-4">
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Search players..."
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                          className="flex-1"
                                        />
                                        <Button 
                                          onClick={handleSearch} 
                                          variant="secondary"
                                          disabled={isSearching}
                                        >
                                          {isSearching ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Search className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                      
                                      {searchResults.length > 0 ? (
                                        <div className="max-h-[200px] overflow-y-auto">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead></TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {searchResults.map((player) => (
                                                <TableRow key={player.id}>
                                                  <TableCell>{player.name}</TableCell>
                                                  <TableCell>{player.email}</TableCell>
                                                  <TableCell>
                                                    <Button 
                                                      size="sm"
                                                      onClick={() => handleAddPlayerToTeam(teamIndex, player)}
                                                    >
                                                      Add
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="text-center py-2">
                                          <p className="text-sm text-muted-foreground">
                                            {isSearching ? "Searching..." : "No results found"}
                                          </p>
                                        </div>
                                      )}
                                      
                                      <div className="pt-4 border-t">
                                        <h3 className="text-sm font-medium mb-2">Create New Player</h3>
                                        <div className="space-y-2">
                                          <Input
                                            placeholder="Player Name"
                                            value={newPlayerName}
                                            onChange={(e) => setNewPlayerName(e.target.value)}
                                          />
                                          <Input
                                            placeholder="Email (optional)"
                                            type="email"
                                            value={newPlayerEmail}
                                            onChange={(e) => setNewPlayerEmail(e.target.value)}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <DialogFooter>
                                      <Button 
                                        onClick={() => {
                                          if (newPlayerName) {
                                            handleAddPlayerToTeam(teamIndex, {
                                              name: newPlayerName,
                                              email: newPlayerEmail,
                                            });
                                            setNewPlayerName("");
                                            setNewPlayerEmail("");
                                          }
                                        }}
                                        disabled={!newPlayerName}
                                      >
                                        Add Player
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              
                              {team.players.length === 0 ? (
                                <div className="text-center py-4 border rounded-md">
                                  <p className="text-sm text-muted-foreground">No players in this team yet</p>
                                </div>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {team.players.map((player, playerIndex) => (
                                      <TableRow key={player.id || playerIndex}>
                                        <TableCell>{player.name}</TableCell>
                                        <TableCell>{player.email || "—"}</TableCell>
                                        <TableCell>
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            onClick={() => handleRemovePlayerFromTeam(teamIndex, playerIndex)}
                                          >
                                            <Trash className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Open registration notice */}
      {registrationMode === "OPEN" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center p-6">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Open Registration Enabled</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Players will be able to register for this tournament on their own once it's published.
                Registration will be open from {" "}
                <span className="font-medium">
                  {getValues("basicDetails.registrationOpenDate")
                    ? new Date(getValues("basicDetails.registrationOpenDate")).toLocaleDateString()
                    : "tournament creation"}
                </span>
                {" "} to {" "}
                <span className="font-medium">
                  {getValues("basicDetails.registrationCloseDate")
                    ? new Date(getValues("basicDetails.registrationCloseDate")).toLocaleDateString()
                    : "tournament start date"}
                </span>.
              </p>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setValue("players.registrationMode", "ADMIN_ONLY")}
                >
                  Switch to Admin Only
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setValue("players.registrationMode", "INVITATION")}
                >
                  Switch to Invitation-Based
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Dialogs */}
      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Create a new player for your tournament.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Player Name</Label>
              <Input
                id="player-name"
                placeholder="Enter player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="player-email">Email (optional)</Label>
              <Input
                id="player-email"
                type="email"
                placeholder="Enter player email"
                value={newPlayerEmail}
                onChange={(e) => setNewPlayerEmail(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPlayerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewPlayer} disabled={!newPlayerName}>
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showAddTeamDialog} onOpenChange={setShowAddTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
            <DialogDescription>
              Create a new team for your tournament.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="Enter team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewTeam} disabled={!newTeamName}>
              Add Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Advanced Settings */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium">Advanced Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="players.autoAssignPlayers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Auto-Assign Players</FormLabel>
                  <FormDescription>
                    Automatically assign players to matches
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="players.allowPlayerSwitching"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Allow Player Switching</FormLabel>
                  <FormDescription>
                    Teams can substitute players during tournament
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
} 