// src/components/fantasy-pickleball/ContestCreationForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";

interface ContestData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  entryFee: number;
  maxEntries: number;
  isDynamicPrizePool: boolean;
  useCustomFees: boolean;
  fees: { name: string; amount: number; isEnabled: boolean }[];
  rules: {
    walletSize: number;
    teamSize: number;
    allowTeamChanges: boolean;
    changeFrequency: string;
    maxPlayersToChange: number;
    changeWindowStart: string;
    changeWindowEnd: string;
  };
}

interface ContestPayload {
  name: string;
  description: string;
  entryFee: number;
  maxEntries: number;
  startDate: Date;
  endDate: Date;
  isDynamicPrizePool: boolean;
  rules: string;
}

interface ContestCreationFormProps {
  tournamentId: string;
}

export default function ContestCreationForm({
  tournamentId,
}: ContestCreationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tournamentDates, setTournamentDates] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);

  const [contestData, setContestData] = useState<ContestData>({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    entryFee: 0,
    maxEntries: 100,
    isDynamicPrizePool: true,
    useCustomFees: false,
    fees: [
      { name: "Free", amount: 0, isEnabled: true },
      { name: "Basic", amount: 500, isEnabled: true },
      { name: "Premium", amount: 1000, isEnabled: true },
      { name: "Elite", amount: 1500, isEnabled: true },
    ],
    rules: {
      walletSize: 60000,
      teamSize: 11,
      allowTeamChanges: true,
      changeFrequency: "daily",
      maxPlayersToChange: 2,
      changeWindowStart: "18:00",
      changeWindowEnd: "22:00",
    },
  });

  useEffect(() => {
    // Fetch tournament details to get date ranges
    const fetchTournament = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tournament");
        }

        const tournament = await response.json();

        const startDate = new Date(tournament.startDate);
        const endDate = new Date(tournament.endDate);

        setTournamentDates({ startDate, endDate });
        setContestData((prev) => ({
          ...prev,
          startDate,
          endDate,
        }));
      } catch (error) {
        console.error("Error fetching tournament:", error);
        toast("Error fetching tournament details");
      }
    };

    fetchTournament();
  }, [tournamentId]);

  const handleInputChange = (field: string, value: any) => {
    // For numeric fields, ensure we handle empty strings and invalid inputs
    if (field === "entryFee" || field === "maxEntries") {
      // Convert to appropriate number type or default to 0 if invalid
      value = typeof value === 'number' ? value : 0;
      
      // Set minimum values based on field
      if (field === "maxEntries" && value < 1) {
        value = 1; // Minimum entries should be at least 1
      }
      
      if (field === "entryFee" && value < 0) {
        value = 0; // Entry fee can't be negative
      }
    }
    
    setContestData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRulesChange = (field: string, value: any) => {
    // Handle numeric fields specially
    if (field === "walletSize" || field === "teamSize" || field === "maxPlayersToChange") {
      // Convert to number or use default values if invalid
      if (typeof value !== 'number') {
        value = parseFloat(value);
        if (isNaN(value)) {
          // Set default values based on field
          if (field === "walletSize") value = 60000;
          else if (field === "teamSize") value = 11;
          else if (field === "maxPlayersToChange") value = 2;
        }
      }
      
      // Enforce minimum values
      if (field === "walletSize" && value < 10000) value = 10000;
      if (field === "teamSize" && value < 3) value = 3;
      if (field === "maxPlayersToChange" && value < 1) value = 1;
      
      // Enforce maximum values
      if (field === "teamSize" && value > 11) value = 11;
      if (field === "maxPlayersToChange" && value > contestData.rules.teamSize) {
        value = contestData.rules.teamSize;
      }
    }

    setContestData((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [field]: value,
      },
    }));
  };

  const handleFeeToggle = (index: number, isEnabled: boolean) => {
    const updatedFees = [...contestData.fees];
    updatedFees[index].isEnabled = isEnabled;
    setContestData((prev) => ({
      ...prev,
      fees: updatedFees,
    }));
  };

  const handleFeeAmountChange = (index: number, amount: number) => {
    const updatedFees = [...contestData.fees];
    updatedFees[index].amount = isNaN(amount) ? 0 : amount;
    setContestData((prev) => ({
      ...prev,
      fees: updatedFees,
    }));
  };

  const calculatePrizePool = (entryFee: number, entryCount: number = 0) => {
    const totalFees = entryCount > 0 ? entryFee * entryCount : entryFee;
    return Math.round(totalFees * 0.7764 * 100) / 100;
  };

  const handleSubmit = async () => {
    if (!contestData.name) {
      toast("Please enter a contest name");
      return;
    }

    setLoading(true);

    try {
      // Create multiple contests based on enabled fees
      if (!contestData.useCustomFees) {
        const enabledFees = contestData.fees.filter((fee) => fee.isEnabled);

        // Create a contest for each enabled fee
        await Promise.all(
          enabledFees.map(async (fee) => {
            const contestName =
              fee.amount > 0
                ? `${contestData.name} - ${fee.name}`
                : `${contestData.name} - Free Entry`;

            const contestPayload: ContestPayload = {
              name: contestName,
              description: contestData.description,
              entryFee: fee.amount,
              maxEntries: contestData.maxEntries,
              startDate: contestData.startDate,
              endDate: contestData.endDate,
              isDynamicPrizePool: true,
              rules: JSON.stringify({
                ...contestData.rules,
                contestType: fee.name,
              }),
            };

            await createContest(contestPayload);
          })
        );
      } else {
        // Create a single contest with custom fee
        const contestPayload: ContestPayload = {
          name: contestData.name,
          description: contestData.description,
          entryFee: contestData.entryFee,
          maxEntries: contestData.maxEntries,
          startDate: contestData.startDate,
          endDate: contestData.endDate,
          isDynamicPrizePool: true,
          rules: JSON.stringify(contestData.rules),
        };

        await createContest(contestPayload);
      }

      // Success notification
      toast("Contest(s) created successfully!");
      
      // Force refresh of the contests list by triggering a fetch with cache-busting
      try {
        console.log("Refreshing contest list after creation");
        const refreshResponse = await fetch(`/api/tournaments/${tournamentId}/contests?force=true&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        
        if (refreshResponse.ok) {
          console.log("Successfully refreshed contests data");
        }
      } catch (refreshError) {
        console.error("Error refreshing contests data:", refreshError);
        // Not blocking the flow even if refresh fails
      }

      // Redirect back to tournament page
      router.push(`/tournaments/${tournamentId}/contests`);
    } catch (error) {
      console.error("Error creating contest(s):", error);
      toast("Failed to create contest(s)");
    } finally {
      setLoading(false);
    }
  };

  const createContest = async (contestData: any) => {
    const response = await fetch(`/api/tournaments/${tournamentId}/contests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...contestData,
        tournamentId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create contest");
    }

    const result = await response.json();
    return result;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-[#00a1e0]">
          Create Fantasy Contest
        </CardTitle>
        <CardDescription>
          Set up a new fantasy contest for your tournament
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        {!contestData.useCustomFees ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Contest Name</Label>
                <Input
                  id="name"
                  placeholder="Enter contest name"
                  value={contestData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxEntries">Max Entries</Label>
                <Input
                  id="maxEntries"
                  type="number"
                  placeholder="100"
                  min="1"
                  value={contestData.maxEntries === 0 ? "" : contestData.maxEntries}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    handleInputChange("maxEntries", isNaN(value) ? 0 : value);
                  }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Contest description"
                value={contestData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Entry Fee Categories</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select entry fee categories for this contest. A separate contest will be created for each selected category. 
                Prize pools are calculated dynamically as 77.64% of total entry fees.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contestData.fees.map((fee, index) => (
                  <Card key={index} className={fee.isEnabled ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{fee.name}</CardTitle>
                        <Switch
                          checked={fee.isEnabled}
                          onCheckedChange={(checked) =>
                            handleFeeToggle(index, checked)
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Entry Fee:
                          </span>
                          <span>
                            {fee.amount === 0
                              ? "Free"
                              : `₹${fee.amount.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Est. Prize Pool (100 entries):
                          </span>
                          <span>
                            {fee.amount === 0
                              ? "₹0.00"
                              : `₹${calculatePrizePool(fee.amount, 100).toFixed(2)}`}
                          </span>
                        </div>
                        {fee.amount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Prize Distribution:
                            </span>
                            <span className="text-xs">
                              {contestData.maxEntries < 5 
                                ? "Winner takes all" 
                                : contestData.maxEntries <= 8 
                                ? "Top 2" 
                                : contestData.maxEntries <= 15 
                                ? "Top 3" 
                                : contestData.maxEntries <= 25 
                                ? "Top 5" 
                                : "Top 10"}
                            </span>
                          </div>
                        )}
                        {fee.amount > 0 && (
                          <div className="mt-2">
                            <Input
                              type="number"
                              placeholder="Amount"
                              min="0"
                              value={fee.amount === 0 ? "" : fee.amount}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                handleFeeAmountChange(index, value);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="entryFee">Entry Fee (₹)</Label>
              <Input
                id="entryFee"
                type="number"
                min="0"
                step="100"
                value={contestData.entryFee === 0 ? "" : contestData.entryFee}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  handleInputChange("entryFee", isNaN(value) ? 0 : value);
                }}
              />
            </div>

            <div>
              <Label htmlFor="estimatedPrizePool">Estimated Prize Pool (₹)</Label>
              <Input
                id="estimatedPrizePool"
                type="number"
                min="0"
                value={Math.round(contestData.entryFee * 0.7764 * 100)}
                disabled={true}
              />
              <p className="text-xs text-gray-500 mt-1">
                77.64% of total entry fees for 100 participants (₹
                {Math.round(contestData.entryFee * 0.7764 * 100)})
              </p>
            </div>
          </div>
        )}

        {/* Fantasy Game Rules */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Fantasy Game Rules</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="walletSize">Wallet Size</Label>
                <Input
                  id="walletSize"
                  type="number"
                  min="10000"
                  step="5000"
                  value={contestData.rules.walletSize === 0 ? "" : contestData.rules.walletSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    handleRulesChange("walletSize", value);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Virtual currency for team creation
                </p>
              </div>

              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  min="3"
                  max="11"
                  value={contestData.rules.teamSize === 0 ? "" : contestData.rules.teamSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    handleRulesChange("teamSize", value);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of players in each team
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allowTeamChanges"
                checked={contestData.rules.allowTeamChanges}
                onCheckedChange={(checked) =>
                  handleRulesChange("allowTeamChanges", checked)
                }
              />
              <Label htmlFor="allowTeamChanges">
                Allow team changes during tournament
              </Label>
            </div>

            {contestData.rules.allowTeamChanges && (
              <div className="pl-6 space-y-4">
                <div>
                  <Label htmlFor="changeFrequency">Change Frequency</Label>
                  <select
                    id="changeFrequency"
                    className="w-full p-2 border rounded mt-1"
                    value={contestData.rules.changeFrequency}
                    onChange={(e) =>
                      handleRulesChange("changeFrequency", e.target.value)
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="matchday">Between Matchdays</option>
                    <option value="once">Once During Tournament</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="maxPlayersToChange">
                    Max Players to Change
                  </Label>
                  <Input
                    id="maxPlayersToChange"
                    type="number"
                    min="1"
                    max={contestData.rules.teamSize}
                    value={contestData.rules.maxPlayersToChange === 0 ? "" : contestData.rules.maxPlayersToChange}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      handleRulesChange("maxPlayersToChange", value);
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="changeWindowStart">Window Start Time</Label>
                    <Input
                      id="changeWindowStart"
                      type="time"
                      value={contestData.rules.changeWindowStart}
                      onChange={(e) =>
                        handleRulesChange("changeWindowStart", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="changeWindowEnd">Window End Time</Label>
                    <Input
                      id="changeWindowEnd"
                      type="time"
                      value={contestData.rules.changeWindowEnd}
                      onChange={(e) =>
                        handleRulesChange("changeWindowEnd", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#00a1e0] hover:bg-[#0072a3]"
          >
            {loading ? "Creating..." : "Create Contest"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
