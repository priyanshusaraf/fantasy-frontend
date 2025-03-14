"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/form";
import { Slider } from "@/components/ui/form";

export default function CreateTournamentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tournamentType, setTournamentType] = useState("individual");
  const [playerCount, setPlayerCount] = useState(4);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalSteps = 7;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    registrationOpenDate: new Date(),
    registrationCloseDate: new Date(
      new Date().setDate(new Date().getDate() + 1)
    ),
    maxParticipants: 32,
    type: "SINGLES" as
      | "SINGLES"
      | "DOUBLES"
      | "MIXED_DOUBLES"
      | "ROUND_ROBIN"
      | "KNOCKOUT"
      | "LEAGUE",
    entryFee: 500,
    playerCategories: [
      { name: "A", price: 11000 },
      { name: "B", price: 9000 },
      { name: "C", price: 7000 },
    ],
    fantasyTeamSize: 7,
    walletSize: 100000,
    allowTeamChanges: true,
    changeFrequency: "daily" as "daily" | "rounds" | "once",
    maxPlayersToChange: 2,
    changeWindowStart: "18:00",
    changeWindowEnd: "22:00",
    contestTypes: [
      { name: "Free Entry", entryFee: 0, active: true },
      { name: "Basic Contest", entryFee: 500, active: true },
      { name: "Premium Contest", entryFee: 1000, active: true },
      { name: "Elite Contest", entryFee: 1500, active: true },
    ],
  });

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        [field]: date,
      }));
    }
  };

  const handleCategoryChange = (
    index: number,
    field: "name" | "price",
    value: string | number
  ) => {
    const newCategories = [...formData.playerCategories];
    newCategories[index] = {
      ...newCategories[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      playerCategories: newCategories,
    }));
  };

  const handleAddCategory = () => {
    setFormData((prev) => ({
      ...prev,
      playerCategories: [
        ...prev.playerCategories,
        {
          name: String.fromCharCode(65 + prev.playerCategories.length),
          price: 5000,
        },
      ],
    }));
  };

  const handleContestTypeChange = (
    index: number,
    field: "name" | "entryFee" | "active",
    value: string | number | boolean
  ) => {
    const newContestTypes = [...formData.contestTypes];
    newContestTypes[index] = {
      ...newContestTypes[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      contestTypes: newContestTypes,
    }));
  };

  const handleCreateTournament = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create tournament");
      }

      const tournament = await response.json();
      router.push(`/admin/tournaments/${tournament.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Tournament</h1>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span>Basic Info</span>
          <span>Players</span>
          <span>Fantasy Rules</span>
          <span>Pricing</span>
          <span>Complete</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tournament Details</CardTitle>
            <CardDescription>
              Enter basic information about your tournament
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                placeholder="Enter tournament name"
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Enter tournament description"
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => handleDateChange("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(formData.endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => handleDateChange("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter tournament location"
                value={formData.location}
                onChange={(e) => handleFormChange("location", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxParticipants">Maximum Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="4"
                value={formData.maxParticipants}
                onChange={(e) =>
                  handleFormChange("maxParticipants", parseInt(e.target.value))
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleNext}>Continue</Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Tournament Format</CardTitle>
            <CardDescription>
              Select the format of your tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              defaultValue={tournamentType}
              onValueChange={setTournamentType}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="individual"
                  id="individual"
                  className="sr-only"
                />
                <Label
                  htmlFor="individual"
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-gray-100 ${
                    tournamentType === "individual"
                      ? "border-primary"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-xl mb-2">👤</span>
                  <span className="font-medium">Individual Based</span>
                  <span className="text-xs text-gray-500">
                    Players compete individually
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="team" id="team" className="sr-only" />
                <Label
                  htmlFor="team"
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-gray-100 ${
                    tournamentType === "team"
                      ? "border-primary"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-xl mb-2">👥</span>
                  <span className="font-medium">Team Based</span>
                  <span className="text-xs text-gray-500">
                    Players are part of teams
                  </span>
                </Label>
              </div>
            </RadioGroup>

            <div className="mt-6">
              <Label>Tournament Type</Label>
              <select
                className="w-full mt-2 p-2 border rounded"
                value={formData.type}
                onChange={(e) => handleFormChange("type", e.target.value)}
              >
                <option value="SINGLES">Singles</option>
                <option value="DOUBLES">Doubles</option>
                <option value="MIXED_DOUBLES">Mixed Doubles</option>
                <option value="ROUND_ROBIN">Round Robin</option>
                <option value="KNOCKOUT">Knockout</option>
                <option value="LEAGUE">League</option>
              </select>
            </div>

            <div className="mt-6">
              <Label>Registration Period</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="registrationOpenDate">Opens</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.registrationOpenDate ? (
                          format(formData.registrationOpenDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.registrationOpenDate}
                        onSelect={(date) =>
                          handleDateChange("registrationOpenDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="registrationCloseDate">Closes</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.registrationCloseDate ? (
                          format(formData.registrationCloseDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.registrationCloseDate}
                        onSelect={(date) =>
                          handleDateChange("registrationCloseDate", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext}>Continue</Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Players</CardTitle>
            <CardDescription>
              Add existing players or create new ones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label>Search Players</Label>
              <Input placeholder="Search players..." className="mb-4" />

              <div className="border rounded-lg p-4 bg-gray-50 mb-4">
                <p className="text-sm text-gray-500 mb-3">
                  Selected Players: {selectedPlayers.length} /{" "}
                  {formData.maxParticipants}
                </p>
                {selectedPlayers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayers.map((id) => (
                      <span
                        key={id}
                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                      >
                        Player {id}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No players selected yet
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {[1, 2, 3, 4, 5, 6].map((player) => (
                  <Card
                    key={player}
                    className={`border ${
                      selectedPlayers.includes(player)
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <h3 className="font-bold">Player {player}</h3>
                        <p className="text-sm text-gray-500">
                          Skill level: Advanced
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Button
                          variant={
                            selectedPlayers.includes(player)
                              ? "destructive"
                              : "default"
                          }
                          size="sm"
                          onClick={() => {
                            if (selectedPlayers.includes(player)) {
                              setSelectedPlayers(
                                selectedPlayers.filter((id) => id !== player)
                              );
                            } else {
                              setSelectedPlayers([...selectedPlayers, player]);
                            }
                          }}
                        >
                          {selectedPlayers.includes(player) ? "Remove" : "Add"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full mb-2">
                Load More Players
              </Button>
              <Button variant="secondary" className="w-full">
                + Create New Player
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext}>Continue</Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Fantasy Team Configuration</CardTitle>
            <CardDescription>
              Set up the fantasy team options for players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label>
                How many players can be selected for a fantasy team?
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                {[4, 7, 9, 11].map((count) => (
                  <Button
                    key={count}
                    variant={
                      formData.fantasyTeamSize === count ? "default" : "outline"
                    }
                    className="h-24 text-center flex flex-col"
                    onClick={() => handleFormChange("fantasyTeamSize", count)}
                  >
                    <span className="text-2xl">{count}</span>
                    <span className="text-xs">Players</span>
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="custom-count">Custom</Label>
                <Input
                  id="custom-count"
                  type="number"
                  min="1"
                  placeholder="Enter custom number"
                  value={
                    formData.fantasyTeamSize !== 4 &&
                    formData.fantasyTeamSize !== 7 &&
                    formData.fantasyTeamSize !== 9 &&
                    formData.fantasyTeamSize !== 11
                      ? formData.fantasyTeamSize
                      : ""
                  }
                  onChange={(e) =>
                    handleFormChange(
                      "fantasyTeamSize",
                      parseInt(e.target.value) || 4
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext}>Continue</Button>
          </CardFooter>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Player Pricing Configuration</CardTitle>
            <CardDescription>
              Set base prices for players in different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label>Wallet Size for Fantasy Players</Label>
                <Input
                  type="number"
                  min="10000"
                  value={formData.walletSize}
                  onChange={(e) =>
                    handleFormChange("walletSize", parseInt(e.target.value))
                  }
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum points/currency users can spend on their fantasy team
                </p>
              </div>

              <div>
                <Label className="mb-2 block">
                  Player Categories & Pricing
                </Label>
                <div className="space-y-3">
                  {formData.playerCategories.map((category, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 gap-4 items-center"
                    >
                      <div>
                        <Label htmlFor={`category-${index}`}>
                          Category {category.name}
                        </Label>
                      </div>
                      <div className="col-span-2">
                        <Input
                          id={`category-${index}`}
                          type="number"
                          value={category.price}
                          onChange={(e) =>
                            handleCategoryChange(
                              index,
                              "price",
                              parseInt(e.target.value)
                            )
                          }
                          placeholder="Base price"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={handleAddCategory}
                  >
                    + Add Another Category
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext}>Continue</Button>
          </CardFooter>
        </Card>
      )}

      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Changes & Windows</CardTitle>
            <CardDescription>
              Configure when and how players can edit their teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow-changes"
                    className="rounded"
                    checked={formData.allowTeamChanges}
                    onChange={(e) =>
                      handleFormChange("allowTeamChanges", e.target.checked)
                    }
                  />
                  <Label htmlFor="allow-changes">Allow Team Changes</Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  Enable users to modify their fantasy teams during the
                  tournament
                </p>
              </div>

              {formData.allowTeamChanges && (
                <>
                  <div className="space-y-3">
                    <Label>Change Frequency</Label>
                    <RadioGroup
                      defaultValue={formData.changeFrequency}
                      onValueChange={(value) =>
                        handleFormChange("changeFrequency", value)
                      }
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily">Daily</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rounds" id="rounds" />
                        <Label htmlFor="rounds">Between Rounds</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="once" id="once" />
                        <Label htmlFor="once">Once During Tournament</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Maximum Players to Change</Label>
                    <Input
                      type="number"
                      min="1"
                      max={formData.fantasyTeamSize}
                      value={formData.maxPlayersToChange}
                      onChange={(e) =>
                        handleFormChange(
                          "maxPlayersToChange",
                          parseInt(e.target.value)
                        )
                      }
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum number of players that can be swapped per change
                      window
                    </p>
                  </div>

                  <div>
                    <Label>Change Window Duration</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Input
                          type="time"
                          value={formData.changeWindowStart}
                          onChange={(e) =>
                            handleFormChange(
                              "changeWindowStart",
                              e.target.value
                            )
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">Start Time</p>
                      </div>
                      <div>
                        <Input
                          type="time"
                          value={formData.changeWindowEnd}
                          onChange={(e) =>
                            handleFormChange("changeWindowEnd", e.target.value)
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">End Time</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext}>Continue</Button>
          </CardFooter>
        </Card>
      )}

      {step === 7 && (
        <Card>
          <CardHeader>
            <CardTitle>Fantasy Entry Fee & Prize Pool</CardTitle>
            <CardDescription>
              Configure the financial aspects of your fantasy tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Tabs defaultValue="preset" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preset">Preset Categories</TabsTrigger>
                  <TabsTrigger value="custom">Custom Entry Fee</TabsTrigger>
                </TabsList>
                <TabsContent value="preset" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {formData.contestTypes.slice(0, 2).map((contest, index) => (
                      <Card
                        key={index}
                        className={`border ${
                          contest.active
                            ? "border-green-500"
                            : "border-gray-200"
                        }`}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id={`contest-${index}`}
                              checked={contest.active}
                              onChange={(e) =>
                                handleContestTypeChange(
                                  index,
                                  "active",
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-xl font-bold">
                              {contest.name}
                            </span>
                          </div>
                          <span>₹{contest.entryFee} Entry</span>
                          <p className="text-xs text-gray-500 mt-2">
                            {contest.entryFee > 0
                              ? "80% Prize Pool"
                              : "For practice only"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.contestTypes.slice(2, 4).map((contest, index) => (
                      <Card
                        key={index + 2}
                        className={`border ${
                          contest.active
                            ? "border-green-500"
                            : "border-gray-200"
                        }`}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id={`contest-${index + 2}`}
                              checked={contest.active}
                              onChange={(e) =>
                                handleContestTypeChange(
                                  index + 2,
                                  "active",
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-xl font-bold">
                              {contest.name}
                            </span>
                          </div>
                          <span>₹{contest.entryFee} Entry</span>
                          <p className="text-xs text-gray-500 mt-2">
                            80% Prize Pool
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="custom" className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="entry-fee">Custom Entry Fee (₹)</Label>
                    <Input
                      id="entry-fee"
                      type="number"
                      min="0"
                      className="mt-2"
                      value={formData.entryFee}
                      onChange={(e) =>
                        handleFormChange("entryFee", parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-semibold mb-2">Fee Breakdown:</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Admin Commission (10%)</span>
                        <span>₹{(formData.entryFee * 0.1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee (10%)</span>
                        <span>₹{(formData.entryFee * 0.1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Prize Pool (80%)</span>
                        <span>₹{(formData.entryFee * 0.8).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <h3 className="font-semibold mb-2">Prize Distribution:</h3>
                <div className="p-4 bg-gray-50 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span>1st Place (40%)</span>
                    <span>₹{(formData.entryFee * 0.8 * 0.4).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2nd Place (24%)</span>
                    <span>₹{(formData.entryFee * 0.8 * 0.24).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3rd Place (16%)</span>
                    <span>₹{(formData.entryFee * 0.8 * 0.16).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    For contests with 30+ participants, positions 4-10 will also
                    receive prizes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleCreateTournament} disabled={loading}>
              {loading ? "Creating..." : "Create Tournament"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {error && (
        <div
          className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
