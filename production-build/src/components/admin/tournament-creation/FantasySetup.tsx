"use client";

import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Plus, Trash2, CopyPlus } from "lucide-react";

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
  
  const contests = watch("fantasy.contests") || [];
  const enableFantasy = watch("fantasy.enableFantasy");
  
  // Add logging to see what values are being used
  const fantasyValues = watch("fantasy");
  useEffect(() => {
    console.log("Fantasy values in FantasySetup:", fantasyValues);
    console.log("Contests in FantasySetup:", fantasyValues?.contests || []);
    console.log("Number of contests:", (fantasyValues?.contests || []).length);
    
    if (fantasyValues?.contests?.length > 0) {
      console.log("First contest:", JSON.stringify(fantasyValues.contests[0], null, 2));
    }
  }, [fantasyValues]);
  
  // Handle adding a new contest
  const handleAddContest = () => {
    if (!newContest.name) {
      console.error("Contest name is required");
      return;
    }
    
    console.log("Adding new contest:", JSON.stringify(newContest, null, 2));
    
    // Ensure all required fields are set with defaults if needed
    const contestToAdd = {
      ...newContest,
      id: `contest-${Date.now()}`,
      entryFee: newContest.entryFee || 0,
      maxEntries: newContest.maxEntries || 100,
      totalPrize: newContest.totalPrize || 0,
      description: newContest.description || `Contest for ${newContest.name}`,
      // Ensure prize breakdown exists
      prizeBreakdown: newContest.prizeBreakdown?.length > 0 
        ? newContest.prizeBreakdown 
        : [{ position: 1, percentage: 100 }],
      // Ensure rules object exists with defaults
      rules: {
        captainMultiplier: newContest.rules?.captainMultiplier || 2,
        viceCaptainMultiplier: newContest.rules?.viceCaptainMultiplier || 1.5,
        teamSize: newContest.rules?.teamSize || 5,
        maxPlayersPerTeam: newContest.rules?.maxPlayersPerTeam || 3,
        maxPlayersFromSameTeam: newContest.rules?.maxPlayersFromSameTeam || 3,
        substitutionsAllowed: newContest.rules?.substitutionsAllowed || 0,
      }
    };
    
    console.log("Contest prepared for saving:", JSON.stringify(contestToAdd, null, 2));
    
    const updatedContests = [...(getValues("fantasy.contests") || [])];
    updatedContests.push(contestToAdd);
    
    console.log("Updated contests array:", JSON.stringify(updatedContests, null, 2));
    setValue("fantasy.contests", updatedContests);
    
    // Reset the form
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
    setShowAddContestDialog(false);
    
    // Log the current fantasy values after update
    setTimeout(() => {
      const currentValues = getValues("fantasy");
      console.log("Fantasy values after adding contest:", currentValues);
      console.log("Number of contests after adding:", (currentValues.contests || []).length);
    }, 100);
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
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="entry-fee" className="text-right">Entry Fee (₹)</Label>
                        <Input
                          id="entry-fee"
                          type="number"
                          min={0}
                          value={newContest.entryFee}
                          onChange={(e) => setNewContest({...newContest, entryFee: parseFloat(e.target.value) || 0})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="max-entries" className="text-right">Max Entries</Label>
                        <Input
                          id="max-entries"
                          type="number"
                          min={1}
                          value={newContest.maxEntries}
                          onChange={(e) => setNewContest({...newContest, maxEntries: parseInt(e.target.value) || 0})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="total-prize" className="text-right">Total Prize (₹)</Label>
                        <Input
                          id="total-prize"
                          type="number"
                          min={0}
                          value={newContest.totalPrize}
                          onChange={(e) => setNewContest({...newContest, totalPrize: parseFloat(e.target.value) || 0})}
                          className="col-span-3"
                        />
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
            
            {contests.length > 0 ? (
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
                    {contests.map((contest: ContestTemplate, index: number) => (
                      <TableRow key={contest.id || index}>
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