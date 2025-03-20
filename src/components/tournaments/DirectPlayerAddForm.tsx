"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { UserPlus, ArrowLeft, CheckCircle, Search } from "lucide-react";

interface DirectPlayerAddFormProps {
  tournamentId: string | number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SKILL_LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "PROFESSIONAL", label: "Professional" }
];

const DOMINANT_HANDS = [
  { value: "RIGHT", label: "Right-handed" },
  { value: "LEFT", label: "Left-handed" },
  { value: "AMBIDEXTROUS", label: "Ambidextrous" }
];

export default function DirectPlayerAddForm({ tournamentId, onSuccess, onCancel }: DirectPlayerAddFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Player data
  const [playerData, setPlayerData] = useState({
    playerId: "",
    name: "",
    email: "",
    phone: "",
    country: "",
    skillLevel: "INTERMEDIATE",
    dominantHand: "RIGHT",
    notes: ""
  });

  // Check if searching by ID only or creating a new player
  const [isCreatingNewPlayer, setIsCreatingNewPlayer] = useState(false);

  // For player search
  const [isSearching, setIsSearching] = useState(false);
  const [foundPlayer, setFoundPlayer] = useState<any>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlayerData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setPlayerData(prev => ({ ...prev, [name]: value }));
  };

  // Search for player by ID
  const handleSearchPlayer = async () => {
    if (!playerData.playerId) {
      toast({
        title: "Error",
        description: "Please enter a player ID to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/players/${playerData.playerId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Player Not Found",
            description: "No player found with that ID. Would you like to create a new player?",
            variant: "destructive",
          });
          setIsCreatingNewPlayer(true);
        } else {
          throw new Error(`Error: ${response.status}`);
        }
        setFoundPlayer(null);
        return;
      }
      
      const player = await response.json();
      setFoundPlayer(player);
      
      // Pre-fill form with found player data
      setPlayerData(prev => ({
        ...prev,
        name: player.name || "",
        email: player.email || "",
        phone: player.phone || "",
        country: player.country || "",
        skillLevel: player.skillLevel || "INTERMEDIATE",
        dominantHand: player.dominantHand || "RIGHT",
      }));
      
      toast({
        title: "Player Found",
        description: `Found player: ${player.name}`,
      });
    } catch (error) {
      console.error("Error searching for player:", error);
      toast({
        title: "Error",
        description: "Failed to search for player. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add player to tournament
  const handleAddPlayerToTournament = async () => {
    // Validation - either playerId or required fields for new player
    if (!isCreatingNewPlayer && !playerData.playerId) {
      toast({
        title: "Error",
        description: "Please enter a player ID or fill out all required fields to create a new player",
        variant: "destructive",
      });
      return;
    }

    if (isCreatingNewPlayer && !playerData.name) {
      toast({
        title: "Error",
        description: "Player name is required when creating a new player",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // If creating a new player, create the player first
      let playerId = playerData.playerId;
      
      if (isCreatingNewPlayer) {
        const createResponse = await fetch("/api/players", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: playerData.name,
            email: playerData.email,
            phone: playerData.phone,
            country: playerData.country,
            skillLevel: playerData.skillLevel,
            dominantHand: playerData.dominantHand,
            notes: playerData.notes
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error("Failed to create new player");
        }
        
        const newPlayer = await createResponse.json();
        playerId = newPlayer.id;
        
        toast({
          title: "Success",
          description: `New player created with ID: ${playerId}`,
        });
      }
      
      // Now add the player to the tournament
      const addResponse = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerIds: [playerId],
        }),
      });
      
      if (!addResponse.ok) {
        throw new Error("Failed to add player to tournament");
      }
      
      const result = await addResponse.json();
      
      toast({
        title: "Success",
        description: "Player successfully added to tournament",
      });
      
      // Refresh or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
        router.push(`/admin/tournaments/${tournamentId}?tab=players`);
      }
    } catch (error) {
      console.error("Error adding player to tournament:", error);
      toast({
        title: "Error",
        description: "Failed to add player to tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Add Player to Tournament</CardTitle>
        <CardDescription>
          Directly add a player to this tournament without requiring them to request access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isCreatingNewPlayer ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="playerId">Player ID</Label>
              <div className="flex gap-2">
                <Input
                  id="playerId"
                  name="playerId"
                  placeholder="Enter player ID"
                  value={playerData.playerId}
                  onChange={handleInputChange}
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleSearchPlayer}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 border-t-2 border-blue-500 rounded-full animate-spin mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter the ID of the player you want to add to this tournament.
              </p>
            </div>
            
            <div className="text-center my-4">
              <span className="text-sm text-muted-foreground">or</span>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsCreatingNewPlayer(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create New Player
            </Button>
            
            {foundPlayer && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h3 className="font-semibold mb-2">Found Player Details:</h3>
                <p><span className="font-medium">Name:</span> {foundPlayer.name}</p>
                {foundPlayer.email && <p><span className="font-medium">Email:</span> {foundPlayer.email}</p>}
                {foundPlayer.country && <p><span className="font-medium">Country:</span> {foundPlayer.country}</p>}
                {foundPlayer.skillLevel && <p><span className="font-medium">Skill Level:</span> {foundPlayer.skillLevel.replace('_', ' ')}</p>}
                {foundPlayer.dominantHand && <p><span className="font-medium">Dominant Hand:</span> {foundPlayer.dominantHand.replace('_', ' ')}</p>}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Player Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter player name"
                value={playerData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={playerData.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="Enter phone number"
                value={playerData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="Enter country"
                  value={playerData.country}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="skillLevel">Skill Level</Label>
                <Select
                  value={playerData.skillLevel}
                  onValueChange={(value) => handleSelectChange("skillLevel", value)}
                >
                  <SelectTrigger id="skillLevel">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dominantHand">Dominant Hand</Label>
              <Select
                value={playerData.dominantHand}
                onValueChange={(value) => handleSelectChange("dominantHand", value)}
              >
                <SelectTrigger id="dominantHand">
                  <SelectValue placeholder="Select dominant hand" />
                </SelectTrigger>
                <SelectContent>
                  {DOMINANT_HANDS.map((hand) => (
                    <SelectItem key={hand.value} value={hand.value}>
                      {hand.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Enter any additional notes"
                value={playerData.notes}
                onChange={handleInputChange}
              />
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreatingNewPlayer(false)}
              className="w-full mt-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Player ID Search
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel || (() => router.back())}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddPlayerToTournament}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="h-4 w-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Add Player
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 