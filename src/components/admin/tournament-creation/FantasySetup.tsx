"use client";

import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Plus, Trash2, CopyPlus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types for Fantasy Contests
interface PrizeBreakdown {
  position: number;
  percentage: number;
}

interface ContestTemplate {
  id?: string;
  name: string;
  entryFee: number;
  maxEntries: number;
  totalPrize: number;
  prizeBreakdown: PrizeBreakdown[];
  rules?: {
    captainMultiplier: number;
    viceCaptainMultiplier: number;
    maxPlayersPerTeam?: number;
    maxPlayersFromSameTeam?: number;
    teamSize: number;
    substitutionsAllowed?: number;
  };
  description?: string;
}

export default function FantasySetup() {
  const { control, watch, setValue, getValues } = useFormContext();
  const [showAddContestDialog, setShowAddContestDialog] = useState(false);
  const [newContest, setNewContest] = useState<ContestTemplate>({
    name: "",
    entryFee: 0,
    maxEntries: 0,
    totalPrize: 0,
    prizeBreakdown: [],
    rules: {
      captainMultiplier: 2,
      viceCaptainMultiplier: 1.5,
      teamSize: 5,
    },
  });
  const [existingContests, setExistingContests] = useState<any[]>([]);
  
  const contests = watch("fantasy.contests") || [];
  const enableFantasy = watch("fantasy.enableFantasy");
  const tournamentId = getValues('id');
  
  // Add logging to see what values are being used
  const fantasyValues = watch("fantasy");
  
  // Fetch existing contests when component loads or tournamentId changes
  useEffect(() => {
    if (tournamentId) {
      fetchExistingContests();
    }
  }, [tournamentId]);

  // Also listen for the success toast that indicates form submission was successful
  useEffect(() => {
    // Add event listener for successful form submission
    const handleSuccessEvent = () => {
      if (tournamentId) {
        console.log("Form submission success detected - fetching contests...");
        // Add slight delay to ensure backend has processed the data
        setTimeout(fetchExistingContests, 500);
      }
    };

    // Listen for the custom success event or toast event
    window.addEventListener('fantasy-settings-saved', handleSuccessEvent);
    
    return () => {
      window.removeEventListener('fantasy-settings-saved', handleSuccessEvent);
    };
  }, [tournamentId]);

  // Function to fetch existing contests from API
  const fetchExistingContests = async () => {
    if (!tournamentId) return;
    
    try {
      console.log(`Fetching existing contests for tournament ${tournamentId}`);
      const timestamp = Date.now();
      const response = await fetch(`/api/tournaments/${tournamentId}/fantasy-contests?t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched contests:", data.contests);
        setExistingContests(data.contests || []);
      } else {
        console.error("Failed to fetch contests:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching contests:", error);
    }
  };
  
  useEffect(() => {
    console.log("Fantasy values in FantasySetup:", fantasyValues);
    console.log("Contests in FantasySetup:", fantasyValues?.contests || []);
    console.log("Number of contests:", (fantasyValues?.contests || []).length);
    
    if (fantasyValues?.contests?.length > 0) {
      console.log("First contest:", JSON.stringify(fantasyValues.contests[0], null, 2));
    }
  }, [fantasyValues]);
  
  const refreshContests = async () => {
    // Force refresh of contests by calling the API with cache-busting
    console.log("Refreshing fantasy contests list");
    
    try {
      await fetchExistingContests();
      console.log("Successfully refreshed contests data");
      
      // Trigger a refresh event using CustomEvent API
      if (typeof window !== 'undefined') {
        console.log("FantasySetup refreshContests: Dispatching fantasy-contest-updated event");
        const refreshEvent = new CustomEvent('fantasy-contest-updated');
        window.dispatchEvent(refreshEvent);
      }
    } catch (error) {
      console.error("Error refreshing contests data:", error);
    }
  };
  
  // Handle adding a new contest
  const handleAddContest = () => {
    // Validate the new contest
    if (!newContest.name || newContest.name.trim() === '') {
      console.error("Contest name is required");
      toast({
        title: "Error",
        description: "Contest name is required",
        variant: "destructive"
      });
      return;
    }

    // Create a new contest object with a unique ID and ensure all required fields are present
    const newContestWithId: ContestTemplate = {
      ...newContest,
      id: `contest-${Date.now()}`,
      name: newContest.name.trim(),
      entryFee: newContest.entryFee || 0,
      maxEntries: newContest.maxEntries || 100,
      totalPrize: newContest.totalPrize || 0,
      // Ensure prize breakdown exists and is valid
      prizeBreakdown: newContest.prizeBreakdown?.length > 0 
        ? newContest.prizeBreakdown 
        : [{ position: 1, percentage: 100 }],
      // Ensure rules object exists with defaults
      rules: {
        captainMultiplier: newContest.rules?.captainMultiplier || 2,
        viceCaptainMultiplier: newContest.rules?.viceCaptainMultiplier || 1.5,
        teamSize: newContest.rules?.teamSize || 5,
        maxPlayersPerTeam: newContest.rules?.maxPlayersPerTeam,
        maxPlayersFromSameTeam: newContest.rules?.maxPlayersFromSameTeam,
        substitutionsAllowed: newContest.rules?.substitutionsAllowed
      }
    };

    // Get current contests array
    const currentContests = getValues("fantasy.contests") || [];

    // Add the new contest
    setValue("fantasy.contests", [...currentContests, newContestWithId]);

    // Close the dialog and reset the form
    setShowAddContestDialog(false);

    // Reset the new contest form
    setNewContest({
      name: "",
      entryFee: 0,
      maxEntries: 0,
      totalPrize: 0,
      prizeBreakdown: [],
      rules: {
        captainMultiplier: 2,
        viceCaptainMultiplier: 1.5,
        teamSize: 5,
      },
    });
    
    // Dispatch custom event to trigger refresh of contest lists on any open pages
    if (typeof window !== 'undefined') {
      console.log("FantasySetup: Dispatching fantasy-contest-updated event");
      window.dispatchEvent(new Event('fantasy-contest-updated'));
    }
    
    // Force refresh contests if there's an ID (meaning it's an existing tournament)
    if (getValues('id')) {
      refreshContests();
    }
  };
  
  // Handle removing a contest
  const handleRemoveContest = (index: number) => {
    const updatedContests = [...(getValues("fantasy.contests") || [])];
    updatedContests.splice(index, 1);
    setValue("fantasy.contests", updatedContests);
  };
  
  // Handle duplicating a contest
  const handleDuplicateContest = (index: number) => {
    const contests = getValues("fantasy.contests") || [];
    const contestToDuplicate = { ...contests[index] };
    
    // Create a new ID and slightly modified name
    contestToDuplicate.id = `contest-${Date.now()}`;
    contestToDuplicate.name = `${contestToDuplicate.name} (Copy)`;
    
    const updatedContests = [...contests, contestToDuplicate];
    setValue("fantasy.contests", updatedContests);
  };
  
  // Update prize breakdown based on positions
  const updatePrizeBreakdown = (positions: number) => {
    const defaultDistribution: PrizeBreakdown[] = [];
    
    // Create default distribution - winner takes most, then decreasing percentages
    if (positions === 1) {
      defaultDistribution.push({ position: 1, percentage: 100 });
    } else if (positions === 2) {
      defaultDistribution.push({ position: 1, percentage: 70 });
      defaultDistribution.push({ position: 2, percentage: 30 });
    } else if (positions === 3) {
      defaultDistribution.push({ position: 1, percentage: 60 });
      defaultDistribution.push({ position: 2, percentage: 30 });
      defaultDistribution.push({ position: 3, percentage: 10 });
    } else {
      // For more positions, create a reasonable distribution
      defaultDistribution.push({ position: 1, percentage: 50 });
      defaultDistribution.push({ position: 2, percentage: 25 });
      defaultDistribution.push({ position: 3, percentage: 15 });
      
      let remainingPercentage = 10;
      const perPositionPercentage = Math.floor(remainingPercentage / (positions - 3));
      
      for (let i = 4; i <= positions; i++) {
        if (i === positions) {
          // Last position gets whatever is left
          defaultDistribution.push({ position: i, percentage: remainingPercentage });
        } else {
          defaultDistribution.push({ position: i, percentage: perPositionPercentage });
          remainingPercentage -= perPositionPercentage;
        }
      }
    }
    
    setNewContest({
      ...newContest,
      prizeBreakdown: defaultDistribution
    });
  };
  
  // Handle prize percentage change
  const handlePrizePercentageChange = (position: number, percentage: number) => {
    const updatedBreakdown = [...newContest.prizeBreakdown];
    const index = updatedBreakdown.findIndex(item => item.position === position);
    
    if (index !== -1) {
      updatedBreakdown[index] = { position, percentage };
      setNewContest({
        ...newContest,
        prizeBreakdown: updatedBreakdown
      });
    }
  };
  
  // Calculate if prize breakdown sums to 100%
  const isPrizeBreakdownValid = () => {
    if (newContest.prizeBreakdown.length === 0) return false;
    
    const sum = newContest.prizeBreakdown.reduce((total, item) => total + item.percentage, 0);
    return Math.abs(sum - 100) < 0.01; // Allow for small floating-point errors
  };

  // Update contest template data
  const handleTemplateChange = (index: number, field: string, value: any) => {
    try {
      // Validate and clean input values based on field
      let cleanedValue = value;
      
      if (field === 'entryFee') {
        // Ensure entry fee is a valid non-negative number
        const numValue = parseFloat(value);
        cleanedValue = !isNaN(numValue) && numValue >= 0 ? numValue : 0;
      } else if (field === 'maxEntries') {
        // Ensure max entries is a valid positive integer
        const numValue = parseInt(value);
        cleanedValue = !isNaN(numValue) && numValue > 0 ? numValue : 1;
      } else if (field === 'totalPrize') {
        // Ensure total prize is a valid non-negative number
        const numValue = parseFloat(value);
        cleanedValue = !isNaN(numValue) && numValue >= 0 ? numValue : 0;
      }
      
      // Get current contests array (safely)
      const currentContests = Array.isArray(contests) ? [...contests] : [];
      if (!currentContests[index]) {
        console.error(`Contest at index ${index} does not exist`);
        return;
      }
      
      // Update the specified field
      const updatedContests = [...currentContests];
      updatedContests[index] = {
        ...updatedContests[index],
        [field]: cleanedValue,
      };
      
      setValue("fantasy.contests", updatedContests);
      
      // Log the change for debugging
      console.log(`Updated ${field} to ${cleanedValue} for contest at index ${index}`);
    } catch (error) {
      console.error(`Error in handleTemplateChange:`, error);
      // Show error in toast
      toast({
        title: "Error",
        description: "Failed to update contest data",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="fantasy.enableFantasy"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Enable Fantasy Contests</FormLabel>
              <FormDescription>
                Allow users to create fantasy teams and compete in contests for this tournament
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
      
      {enableFantasy && (
        <>
          <FormField
            control={control}
            name="fantasy.fantasyPoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fantasy Points System</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select points system" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard Points</SelectItem>
                    <SelectItem value="ADVANCED">Advanced Points</SelectItem>
                    <SelectItem value="CUSTOM">Custom Points</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose how fantasy points will be calculated for players
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {watch("fantasy.fantasyPoints") === "CUSTOM" && (
            <Card className="border p-4">
              <CardHeader className="px-2 pt-2 pb-0">
                <CardTitle className="text-base">Custom Fantasy Points</CardTitle>
              </CardHeader>
              <CardContent className="px-2 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="fantasy.customPoints.win"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Win Bonus</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Points for winning a match</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="fantasy.customPoints.pointWon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Point Won</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Points for each point won</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="fantasy.customPoints.ace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ace</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Points for each ace/winner</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="fantasy.customPoints.error"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Error</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Points deduction for errors</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Fantasy Contests</h3>
              <Dialog open={showAddContestDialog} onOpenChange={setShowAddContestDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contest
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Fantasy Contest</DialogTitle>
                    <DialogDescription>
                      Configure the details and prize structure for this contest.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Basic Details</TabsTrigger>
                      <TabsTrigger value="rules">Contest Rules</TabsTrigger>
                      <TabsTrigger value="prizes">Prize Structure</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contest-name" className="text-right">Contest Name</Label>
                        <Input
                          id="contest-name"
                          value={newContest.name}
                          onChange={(e) => setNewContest({...newContest, name: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="entry-fee">Entry Fee</Label>
                          <Input
                            id="entry-fee"
                            type="number"
                            min="0"
                            value={newContest.entryFee}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = parseFloat(value);
                              // Ensure it's a valid non-negative number
                              const validValue = !isNaN(numValue) && numValue >= 0 ? numValue : 0;
                              
                              setNewContest({
                                ...newContest, 
                                entryFee: validValue
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="max-entries">Max Entries</Label>
                          <Input
                            id="max-entries"
                            type="number"
                            min="1"
                            value={newContest.maxEntries}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = parseInt(value);
                              // Ensure it's a valid positive integer
                              const validValue = !isNaN(numValue) && numValue > 0 ? numValue : 1;
                              
                              setNewContest({
                                ...newContest, 
                                maxEntries: validValue
                              });
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Prize pool will be calculated dynamically as 77.64% of all entry fees collected.
                          It will update automatically as users register for the contest.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">Description</Label>
                        <Textarea
                          id="description"
                          value={newContest.description || ""}
                          onChange={(e) => setNewContest({...newContest, description: e.target.value})}
                          className="col-span-3"
                          rows={3}
                          placeholder="Add contest description here..."
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="rules" className="space-y-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="team-size" className="text-right">Team Size</Label>
                        <Input
                          id="team-size"
                          type="number"
                          min={1}
                          value={newContest.rules?.teamSize || 5}
                          onChange={(e) => setNewContest({
                            ...newContest, 
                            rules: {
                              ...newContest.rules!,
                              teamSize: parseInt(e.target.value) || 5
                            }
                          })}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="captain-multiplier" className="text-right">Captain Points Multiplier</Label>
                        <Input
                          id="captain-multiplier"
                          type="number"
                          min={1}
                          step={0.5}
                          value={newContest.rules?.captainMultiplier || 2}
                          onChange={(e) => setNewContest({
                            ...newContest, 
                            rules: {
                              ...newContest.rules!,
                              captainMultiplier: parseFloat(e.target.value) || 2
                            }
                          })}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="vc-multiplier" className="text-right">Vice-Captain Points Multiplier</Label>
                        <Input
                          id="vc-multiplier"
                          type="number"
                          min={1}
                          step={0.5}
                          value={newContest.rules?.viceCaptainMultiplier || 1.5}
                          onChange={(e) => setNewContest({
                            ...newContest, 
                            rules: {
                              ...newContest.rules!,
                              viceCaptainMultiplier: parseFloat(e.target.value) || 1.5
                            }
                          })}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="max-same-team" className="text-right">Max Players from Same Real Team</Label>
                        <Input
                          id="max-same-team"
                          type="number"
                          min={0}
                          value={newContest.rules?.maxPlayersFromSameTeam || ""}
                          onChange={(e) => setNewContest({
                            ...newContest, 
                            rules: {
                              ...newContest.rules!,
                              maxPlayersFromSameTeam: parseInt(e.target.value) || undefined
                            }
                          })}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="substitutions" className="text-right">Substitutions Allowed</Label>
                        <Input
                          id="substitutions"
                          type="number"
                          min={0}
                          value={newContest.rules?.substitutionsAllowed || ""}
                          onChange={(e) => setNewContest({
                            ...newContest, 
                            rules: {
                              ...newContest.rules!,
                              substitutionsAllowed: parseInt(e.target.value) || undefined
                            }
                          })}
                          className="col-span-3"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="prizes" className="space-y-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="prize-positions" className="text-right">Number of Prize Positions</Label>
                        <div className="col-span-3 flex gap-2">
                          <Input
                            id="prize-positions"
                            type="number"
                            min={1}
                            max={20}
                            value={newContest.prizeBreakdown.length || 1}
                            onChange={(e) => updatePrizeBreakdown(parseInt(e.target.value) || 1)}
                            className="flex-1"
                          />
                          <Button 
                            variant="outline" 
                            type="button" 
                            onClick={() => updatePrizeBreakdown(newContest.prizeBreakdown.length || 1)}
                            className="whitespace-nowrap"
                          >
                            Auto Distribute
                          </Button>
                        </div>
                      </div>
                      
                      {newContest.prizeBreakdown.length > 0 && (
                        <div className="border rounded-md p-4 mt-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            Prize distribution (total must equal 100%)
                          </p>
                          <div className="space-y-2">
                            {newContest.prizeBreakdown
                              .sort((a, b) => a.position - b.position)
                              .map((prize) => (
                                <div key={prize.position} className="grid grid-cols-5 gap-2 items-center">
                                  <span className="col-span-2 text-sm">{getPositionLabel(prize.position)}</span>
                                  <div className="col-span-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={prize.percentage}
                                      onChange={(e) => handlePrizePercentageChange(
                                        prize.position, 
                                        parseFloat(e.target.value) || 0
                                      )}
                                    />
                                  </div>
                                  <span className="text-sm">%</span>
                                </div>
                              ))}
                          </div>
                          
                          <div className="mt-4 pt-2 border-t flex justify-between items-center">
                            <span className="text-sm font-medium">Total:</span>
                            <span className={`font-medium ${isPrizeBreakdownValid() ? 'text-green-600' : 'text-red-600'}`}>
                              {newContest.prizeBreakdown.reduce((sum, prize) => sum + prize.percentage, 0).toFixed(1)}%
                              {!isPrizeBreakdownValid() && ' (must be 100%)'}
                            </span>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddContestDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddContest}
                      disabled={!newContest.name || !isPrizeBreakdownValid()}
                    >
                      Add Contest
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Display either form contests (for new tournaments) or existing contests from API (for existing tournaments) */}
            {(contests.length > 0 || existingContests.length > 0) ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contest Name</TableHead>
                      <TableHead>Entry Fee</TableHead>
                      <TableHead>Total Prize</TableHead>
                      <TableHead>Max Entries</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Display form contests (for new tournaments) */}
                    {contests.map((contest: ContestTemplate, index: number) => (
                      <TableRow key={`form-${contest.id || index}`}>
                        <TableCell className="font-medium">{contest.name}</TableCell>
                        <TableCell>₹{Number(contest.entryFee).toFixed(2)}</TableCell>
                        <TableCell>₹{Number(contest.totalPrize).toFixed(2)}</TableCell>
                        <TableCell>{contest.maxEntries}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDuplicateContest(index)}
                              title="Duplicate"
                            >
                              <CopyPlus className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveContest(index)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Display existing API contests (for existing tournaments) */}
                    {existingContests.map((contest: any) => (
                      <TableRow key={`api-${contest.id}`}>
                        <TableCell className="font-medium">{contest.name}</TableCell>
                        <TableCell>₹{Number(contest.entryFee).toFixed(2)}</TableCell>
                        <TableCell>₹{Number(contest.prizePool).toFixed(2)}</TableCell>
                        <TableCell>{contest.maxEntries}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="View Contest"
                              onClick={() => window.open(`/fantasy/contests/${contest.id}`, '_blank')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 border rounded-md">
                <h3 className="text-lg font-medium mb-2">No Contests Added</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  There are no fantasy contests created for this tournament yet.
                  Add a contest to allow users to participate in fantasy competitions.
                </p>
                <Button onClick={() => setShowAddContestDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Contest
                </Button>
              </div>
            )}
          </div>
          
          <FormField
            control={control}
            name="fantasy.autoPublish"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Auto-publish Fantasy Contests</FormLabel>
                  <FormDescription>
                    Automatically make fantasy contests available when the tournament starts
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
        </>
      )}
    </div>
  );
}

// Helper to get position labels (1st, 2nd, 3rd, etc.)
function getPositionLabel(position: number): string {
  if (position === 1) return "1st Place";
  if (position === 2) return "2nd Place";
  if (position === 3) return "3rd Place";
  return `${position}th Place`;
} 