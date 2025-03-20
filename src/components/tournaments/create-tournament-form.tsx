"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Trash, CalendarIcon, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Tournament Types & Schema using zod for validation
const TournamentTypeEnum = z.enum([
  "SINGLES",
  "DOUBLES",
  "MIXED_DOUBLES",
  "ROUND_ROBIN",
  "KNOCKOUT",
  "LEAGUE",
]);

const TournamentStatusEnum = z.enum([
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

const TournamentSchema = z.object({
  name: z.string().min(3, "Tournament name must have at least 3 characters"),
  description: z.string().optional(),
  type: TournamentTypeEnum,
  startDate: z.date(),
  startTime: z.string(),
  endDate: z.date(),
  endTime: z.string(),
  registrationOpenDate: z.date(),
  registrationOpenTime: z.string(),
  registrationCloseDate: z.date(),
  registrationCloseTime: z.string(),
  location: z.string().min(3, "Location must have at least 3 characters"),
  maxParticipants: z.number().min(2, "Must have at least 2 participants"),
  entryFee: z.number().min(0, "Entry fee cannot be negative"),
  isTeamBased: z.boolean().optional(),
  enableLiveScoring: z.boolean().optional(),
  imageUrl: z.string().optional(),
  rules: z.string().optional(),
  prizeMoney: z.number().optional(),
});

type CreateTournamentInput = z.infer<typeof TournamentSchema>;

// Define types for players and referees
interface Player {
  id: number;
  name: string;
  skillLevel?: string;
  imageUrl?: string;
}

interface Team {
  id: string; // Temporary client-side ID
  name: string;
  players: Player[];
}

interface Referee {
  id: number;
  name: string;
  certificationLevel?: string;
}

const CreateTournamentForm: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [availableReferees, setAvailableReferees] = useState<Referee[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [selectedReferees, setSelectedReferees] = useState<Referee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('basic');
  const [step, setStep] = useState(1);
  
  const form = useForm<CreateTournamentInput>({
    resolver: zodResolver(TournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "SINGLES",
      startDate: new Date(),
      startTime: "16:00", // Default to 4:00 PM
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      endTime: "20:00", // Default to 8:00 PM
      registrationOpenDate: new Date(),
      registrationOpenTime: "09:00", // Default to 9:00 AM
      registrationCloseDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      registrationCloseTime: "16:00", // Default to 4:00 PM (matches tournament start time)
      location: "",
      maxParticipants: 32,
      entryFee: 0,
      isTeamBased: false,
      enableLiveScoring: true,
      rules: "",
      prizeMoney: 0,
    },
  });

  const isTeamBased = form.watch("isTeamBased");
  const enableLiveScoring = form.watch("enableLiveScoring");
  const tournamentType = form.watch("type");

  // Fetch available players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/players");
        if (response.ok) {
          const data = await response.json();
          setAvailablePlayers(data.players);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
        toast.error("Failed to load players");
      }
    };

    fetchPlayers();
  }, []);

  // Fetch available referees
  useEffect(() => {
    const fetchReferees = async () => {
      try {
        const response = await fetch("/api/referees");
        if (response.ok) {
          const data = await response.json();
          setAvailableReferees(data.referees);
        }
      } catch (error) {
        console.error("Error fetching referees:", error);
        toast.error("Failed to load referees");
      }
    };

    if (enableLiveScoring) {
      fetchReferees();
    }
  }, [enableLiveScoring]);

  // Filter players based on search term
  const filteredPlayers = availablePlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedPlayers.some((selected) => selected.id === player.id) &&
      !teams.some((team) =>
        team.players.some((teamPlayer) => teamPlayer.id === player.id)
      )
  );

  // Filter referees based on search term
  const filteredReferees = availableReferees.filter(
    (referee) =>
      referee.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedReferees.some((selected) => selected.id === referee.id)
  );

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayers([...selectedPlayers, player]);
    setSearchTerm('');
  };

  const handleRefereeSelect = (referee: Referee) => {
    setSelectedReferees([...selectedReferees, referee]);
    setSearchTerm('');
  };

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
  };

  const handleRemoveReferee = (refereeId: number) => {
    setSelectedReferees(selectedReferees.filter((r) => r.id !== refereeId));
  };

  const handleAddTeam = () => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: `Team ${teams.length + 1}`,
      players: [],
    };
    setTeams([...teams, newTeam]);
  };

  const handleUpdateTeamName = (teamId: string, newName: string) => {
    setTeams(
      teams.map((team) =>
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
  };

  const handleAddPlayerToTeam = (teamId: string, player: Player) => {
    setTeams(
      teams.map((team) =>
        team.id === teamId
          ? { ...team, players: [...team.players, player] }
          : team
      )
    );
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== player.id));
  };

  const handleRemovePlayerFromTeam = (teamId: string, playerId: number) => {
    const removedPlayer = teams
      .find((team) => team.id === teamId)
      ?.players.find((player) => player.id === playerId);

    if (removedPlayer) {
      setSelectedPlayers([...selectedPlayers, removedPlayer]);
      setTeams(
        teams.map((team) =>
          team.id === teamId
            ? {
                ...team,
                players: team.players.filter(
                  (player) => player.id !== playerId
                ),
              }
            : team
        )
      );
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    const teamToRemove = teams.find((team) => team.id === teamId);
    if (teamToRemove) {
      // Add players back to selected players
      setSelectedPlayers([...selectedPlayers, ...teamToRemove.players]);
      setTeams(teams.filter((team) => team.id !== teamId));
    }
  };

  const onSubmit = async (data: CreateTournamentInput) => {
    try {
      setLoading(true);

      // Validate based on isTeamBased
      if (isTeamBased && teams.length < 2) {
        toast.error("You need at least 2 teams for a team-based tournament");
        setLoading(false);
        return;
      }

      if (!isTeamBased && selectedPlayers.length < 2) {
        toast.error("You need at least 2 players for an individual tournament");
        setLoading(false);
        return;
      }

      if (enableLiveScoring && selectedReferees.length === 0) {
        toast.error("You need at least 1 referee for live scoring");
        setLoading(false);
        return;
      }

      // Prepare player IDs
      const playerIds = isTeamBased
        ? teams.flatMap((team) => team.players.map((player) => player.id))
        : selectedPlayers.map((player) => player.id);

      // Prepare teams data
      const teamsData = isTeamBased
        ? teams.map((team) => ({
            name: team.name,
            playerIds: team.players.map((player) => player.id),
          }))
        : [];

      // Prepare referee IDs
      const refereeIds = selectedReferees.map((referee) => referee.id);

      // Combine date and time for each DateTime field
      const combineDateAndTime = (date: Date, timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
      };

      // Create the tournament with combined date and time
      const tournamentData = {
        ...data,
        startDate: combineDateAndTime(data.startDate, data.startTime),
        endDate: combineDateAndTime(data.endDate, data.endTime),
        registrationOpenDate: combineDateAndTime(data.registrationOpenDate, data.registrationOpenTime),
        registrationCloseDate: combineDateAndTime(data.registrationCloseDate, data.registrationCloseTime),
        organizerId: user?.id,
        playerIds,
        teamsData: isTeamBased ? teamsData : undefined,
        refereeIds: enableLiveScoring ? refereeIds : undefined,
      };

      // Remove time-only fields before submitting
      delete tournamentData.startTime;
      delete tournamentData.endTime;
      delete tournamentData.registrationOpenTime;
      delete tournamentData.registrationCloseTime;

      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tournamentData),
      });

      if (!response.ok) {
        throw new Error("Failed to create tournament");
      }

      const result = await response.json();
      toast.success("Tournament created successfully!");
      router.push(`/tournaments/${result.id}`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while creating the tournament"
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Create New Tournament</h1>

      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <div
            className={`h-8 w-8 rounded-full ${
              step >= 1 ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
            } flex items-center justify-center text-white font-bold`}
          >
            1
          </div>
          <div className="h-1 w-16 bg-gray-300 dark:bg-gray-700 flex-grow"></div>
          <div
            className={`h-8 w-8 rounded-full ${
              step >= 2 ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
            } flex items-center justify-center text-white font-bold`}
          >
            2
          </div>
          <div className="h-1 w-16 bg-gray-300 dark:bg-gray-700 flex-grow"></div>
          <div
            className={`h-8 w-8 rounded-full ${
              step >= 3 ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
            } flex items-center justify-center text-white font-bold`}
          >
            3
          </div>
        </div>
      </div>

        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Basic Information</h2>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                      <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                      {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="entryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Set to 0 for free entry
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prizeMoney"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prize Money (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Total prize pool amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Tournament Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                          <SelectItem value="SINGLES">Singles</SelectItem>
                          <SelectItem value="DOUBLES">Doubles</SelectItem>
                          <SelectItem value="MIXED_DOUBLES">
                            Mixed Doubles
                          </SelectItem>
                          <SelectItem value="ROUND_ROBIN">
                            Round Robin
                        </SelectItem>
                          <SelectItem value="KNOCKOUT">Knockout</SelectItem>
                          <SelectItem value="LEAGUE">League</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
                  name="rules"
              render={({ field }) => (
                <FormItem>
                      <FormLabel>Tournament Rules</FormLabel>
                  <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter tournament rules and guidelines..."
                        />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                  name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < form.getValues("startDate")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                  name="registrationOpenDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Registration Start</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationOpenTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationCloseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Registration End</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < form.getValues("registrationOpenDate") ||
                            date > form.getValues("startDate")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationCloseTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <div className="space-y-4">
              <FormField
                control={form.control}
                  name="isTeamBased"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Team-based Tournament</FormLabel>
                        <FormDescription>
                          Enable team-based tournament format
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
                control={form.control}
                  name="enableLiveScoring"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Live Scoring</FormLabel>
                        <FormDescription>
                          Enable live scoring for matches
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
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                {isTeamBased ? "Team Setup" : "Player Selection"}
              </h2>

              {/* Search component */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                  placeholder={`Search for ${
                    enableLiveScoring ? "players or referees" : "players"
                  }...`}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Tabs defaultValue="players" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="players" className="w-full">
                    Players
                  </TabsTrigger>
                  {enableLiveScoring && (
                    <TabsTrigger value="referees" className="w-full">
                      Referees
                    </TabsTrigger>
                  )}
                  {isTeamBased && (
                    <TabsTrigger value="teams" className="w-full">
                      Teams
                    </TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="players">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Players</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 overflow-y-auto mb-4 border rounded-md">
                        {filteredPlayers.length > 0 ? (
                          <ul className="divide-y">
                            {filteredPlayers.map((player) => (
                              <li
                                key={player.id}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                onClick={() => handlePlayerSelect(player)}
                              >
                                <span>{player.name}</span>
                                <Badge variant="secondary">
                                  {player.skillLevel || "Unrated"}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="p-4 text-center text-muted-foreground">
                            No players found
                          </p>
                        )}
                      </div>

                      <h3 className="text-lg font-medium mb-2">Selected Players</h3>
                      <div className="border rounded-md p-2 min-h-20">
                        {selectedPlayers.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedPlayers.map((player) => (
                              <Badge
                                key={player.id}
                                className="py-1 px-2 flex items-center"
                                variant="outline"
                              >
                                {player.name}
                                <X
                                  className="ml-1 h-3 w-3 cursor-pointer"
                                  onClick={() => handleRemovePlayer(player.id)}
                                />
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground">
                            No players selected
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {enableLiveScoring && (
                  <TabsContent value="referees">
                    <Card>
                      <CardHeader>
                        <CardTitle>Available Referees</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-40 overflow-y-auto mb-4 border rounded-md">
                          {filteredReferees.length > 0 ? (
                            <ul className="divide-y">
                              {filteredReferees.map((referee) => (
                                <li
                                  key={referee.id}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                  onClick={() => handleRefereeSelect(referee)}
                                >
                                  <span>{referee.name}</span>
                                  <Badge variant="secondary">
                                    {referee.certificationLevel || "Level 1"}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="p-4 text-center text-muted-foreground">
                              No referees found
                            </p>
                          )}
                        </div>

                        <h3 className="text-lg font-medium mb-2">
                          Selected Referees
                        </h3>
                        <div className="border rounded-md p-2 min-h-20">
                          {selectedReferees.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedReferees.map((referee) => (
                                <Badge
                                  key={referee.id}
                                  className="py-1 px-2 flex items-center"
                                  variant="outline"
                                >
                                  {referee.name}
                                  <X
                                    className="ml-1 h-3 w-3 cursor-pointer"
                                    onClick={() => handleRemoveReferee(referee.id)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground">
                              No referees selected
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {isTeamBased && (
                  <TabsContent value="teams">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Teams</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddTeam}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Team
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {teams.length === 0 && (
                          <p className="text-center py-4 text-muted-foreground">
                            No teams created yet. Click &quot;Add Team&quot; to create a team.
                          </p>
                        )}
                        
                        {teams.map((team) => (
                          <div
                            key={team.id}
                            className="mb-6 p-4 border rounded-md"
                          >
                            <div className="flex justify-between items-center mb-2">
                    <Input
                                  value={team.name}
                                  onChange={(e) =>
                                    handleUpdateTeamName(team.id, e.target.value)
                                  }
                                  className="w-48 mr-2"
                                />
                                <Badge>
                                  {team.players.length}{" "}
                                  {team.players.length === 1
                                    ? "player"
                                    : "players"}
                                </Badge>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveTeam(team.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="mb-2">
                              <h4 className="text-sm font-medium mb-1">Team Members</h4>
                              {team.players.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {team.players.map((player) => (
                                    <Badge
                                      key={player.id}
                                      className="py-1 px-2 flex items-center"
                                      variant="outline"
                                    >
                                      {player.name}
                                      <X
                                        className="ml-1 h-3 w-3 cursor-pointer"
                                        onClick={() =>
                                          handleRemovePlayerFromTeam(
                                            team.id,
                                            player.id
                                          )
                                        }
                                      />
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No players added to team
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-1">
                                Add Players to Team
                              </h4>
                              {selectedPlayers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {selectedPlayers.map((player) => (
                                    <Badge
                                      key={player.id}
                                      className="bg-primary-foreground text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer"
                                      onClick={() =>
                                        handleAddPlayerToTeam(team.id, player)
                                      }
                                    >
                                      + {player.name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No available players to add
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
              )}
              </Tabs>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            <Button
              type={step === 3 ? "submit" : "button"}
              onClick={step < 3 ? nextStep : undefined}
              disabled={loading}
            >
              {loading && <span className="animate-spin mr-2">⏳</span>}
              {step < 3 ? "Next" : "Create Tournament"}
            </Button>
          </div>
          </form>
        </Form>
    </div>
  );
};

export default CreateTournamentForm;
