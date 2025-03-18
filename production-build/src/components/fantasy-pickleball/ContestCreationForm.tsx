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
import { toast } from "sonner";

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

  const [contestData, setContestData] = useState({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    entryFee: 0,
    prizePool: 0,
    maxEntries: 100,
    useCustomFees: false,
    fees: [
      { name: "Free", amount: 0, isEnabled: true },
      { name: "Basic", amount: 500, isEnabled: true },
      { name: "Premium", amount: 1000, isEnabled: true },
      { name: "Elite", amount: 1500, isEnabled: true },
    ],
    rules: {
      walletSize: 100000,
      teamSize: 7,
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
    setContestData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRulesChange = (field: string, value: any) => {
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
    updatedFees[index].amount = amount;
    setContestData((prev) => ({
      ...prev,
      fees: updatedFees,
    }));
  };

  const calculatePrizePool = (entryFee: number) => {
    return entryFee * 0.8; // 80% of entry fee goes to prize pool
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

            const contestPayload = {
              name: contestName,
              entryFee: fee.amount,
              prizePool: calculatePrizePool(fee.amount),
              maxEntries: contestData.maxEntries,
              startDate: contestData.startDate,
              endDate: contestData.endDate,
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
        const contestPayload = {
          name: contestData.name,
          entryFee: contestData.entryFee,
          prizePool:
            contestData.prizePool || calculatePrizePool(contestData.entryFee),
          maxEntries: contestData.maxEntries,
          startDate: contestData.startDate,
          endDate: contestData.endDate,
          rules: JSON.stringify(contestData.rules),
        };

        await createContest(contestPayload);
      }

      // Success notification
      toast("Contest(s) created successfully!");

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
    const response = await fetch(
      `/api/tournaments/${tournamentId}/fantasy-contests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(contestData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create contest");
    }

    return response.json();
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
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Contest Name</Label>
            <Input
              id="name"
              value={contestData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter contest name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {contestData.startDate
                      ? format(contestData.startDate, "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={contestData.startDate}
                    onSelect={(date) =>
                      date && handleInputChange("startDate", date)
                    }
                    disabled={(date) => {
                      if (!tournamentDates) return false;
                      return (
                        date < tournamentDates.startDate ||
                        date > tournamentDates.endDate
                      );
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {contestData.endDate
                      ? format(contestData.endDate, "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={contestData.endDate}
                    onSelect={(date) =>
                      date && handleInputChange("endDate", date)
                    }
                    disabled={(date) => {
                      if (!tournamentDates) return false;
                      return (
                        date < contestData.startDate ||
                        date > tournamentDates.endDate
                      );
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="maxEntries">Maximum Entries</Label>
            <Input
              id="maxEntries"
              type="number"
              min="1"
              value={contestData.maxEntries}
              onChange={(e) =>
                handleInputChange("maxEntries", parseInt(e.target.value))
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of teams allowed in this contest
            </p>
          </div>
        </div>

        {/* Entry Fee Setup */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Entry Fees & Prize Pools</h3>

          <Tabs defaultValue="preset">
            <TabsList className="mb-4">
              <TabsTrigger value="preset">Preset Categories</TabsTrigger>
              <TabsTrigger
                value="custom"
                onClick={() => handleInputChange("useCustomFees", true)}
              >
                Custom Fee
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preset">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contestData.fees.map((fee, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">
                          {fee.name} Entry
                        </Label>
                        <Switch
                          checked={fee.isEnabled}
                          onCheckedChange={(checked) =>
                            handleFeeToggle(index, checked)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`fee-${index}`}>Entry Fee (₹)</Label>
                        <Input
                          id={`fee-${index}`}
                          type="number"
                          min="0"
                          step="100"
                          value={fee.amount}
                          onChange={(e) =>
                            handleFeeAmountChange(index, Number(e.target.value))
                          }
                          disabled={!fee.isEnabled}
                        />
                        {fee.isEnabled && fee.amount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Prize Pool: ₹{Math.round(fee.amount * 0.8)} (80% of
                            entry fee)
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min="0"
                    step="100"
                    value={contestData.entryFee}
                    onChange={(e) =>
                      handleInputChange("entryFee", Number(e.target.value))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="prizePool">Prize Pool (₹)</Label>
                  <Input
                    id="prizePool"
                    type="number"
                    min="0"
                    value={
                      contestData.prizePool ||
                      Math.round(contestData.entryFee * 0.8)
                    }
                    onChange={(e) =>
                      handleInputChange("prizePool", Number(e.target.value))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 80% of entry fee (₹
                    {Math.round(contestData.entryFee * 0.8)})
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

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
                  value={contestData.rules.walletSize}
                  onChange={(e) =>
                    handleRulesChange("walletSize", Number(e.target.value))
                  }
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
                  value={contestData.rules.teamSize}
                  onChange={(e) =>
                    handleRulesChange("teamSize", Number(e.target.value))
                  }
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
                    value={contestData.rules.maxPlayersToChange}
                    onChange={(e) =>
                      handleRulesChange(
                        "maxPlayersToChange",
                        Number(e.target.value)
                      )
                    }
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
