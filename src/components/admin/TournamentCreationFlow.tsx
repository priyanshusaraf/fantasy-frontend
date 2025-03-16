"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Plus,
  Trophy,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Step-specific components
import TournamentBasicDetails from "./tournament-creation/TournamentBasicDetails";
import TournamentTeamsSetup from "./tournament-creation/TournamentTeamsSetup";
import TournamentPlayersSetup from "./tournament-creation/TournamentPlayersSetup";
import TournamentFantasySetup from "./tournament-creation/TournamentFantasySetup";
import TournamentReview from "./tournament-creation/TournamentReview";

// Define the tournament creation steps
const STEPS = [
  { id: "basic", title: "Basic Details", description: "Tournament information" },
  { id: "format", title: "Tournament Format", description: "Teams and structure" },
  { id: "players", title: "Players", description: "Add players to the tournament" },
  { id: "fantasy", title: "Fantasy Setup", description: "Configure fantasy contests" },
  { id: "review", title: "Review & Create", description: "Finalize tournament creation" },
];

// Schema for basic details validation
const basicDetailsSchema = z.object({
  name: z.string().min(3, "Tournament name must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["SINGLES", "DOUBLES", "MIXED_DOUBLES", "ROUND_ROBIN", "KNOCKOUT", "LEAGUE"]),
  location: z.string().min(3, "Please enter a valid location"),
  startDate: z.date(),
  endDate: z.date(),
  registrationOpenDate: z.date(),
  registrationCloseDate: z.date(),
  maxParticipants: z.number().int().min(2),
  entryFee: z.number().min(0),
  prizeMoney: z.number().optional(),
  rules: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

// Schema for format details
const formatDetailsSchema = z.object({
  isTeamBased: z.boolean(),
  maxPlayersPerTeam: z.number().int().min(1).optional(),
  teamsEnabled: z.boolean().default(false),
  scoringType: z.enum(["STANDARD", "CUSTOM"]).default("STANDARD"),
  pointsToWin: z.number().int().min(1).default(11),
  numberOfSets: z.number().int().min(1).default(1),
  winByTwo: z.boolean().default(true),
  liveScoring: z.boolean().default(true),
});

// Schema for fantasy setup
const fantasySetupSchema = z.object({
  fantasyEnabled: z.boolean().default(true),
  contestTypes: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      entryFee: z.number().min(0),
      prizePool: z.number().optional(),
      maxEntries: z.number().int().min(1),
      walletSize: z.number().int().min(1000),
      playerCategories: z.array(
        z.object({
          name: z.string().min(1),
          price: z.number().min(1),
        })
      ),
      allowTeamChanges: z.boolean().default(false),
      changeFrequency: z.enum(["DAILY", "MATCH_BASED", "NONE"]).optional(),
      maxPlayersToChange: z.number().int().min(0).optional(),
    })
  ).optional(),
});

// Combine schemas for the full tournament creation form
const tournamentCreationSchema = z.object({
  basicDetails: basicDetailsSchema,
  formatDetails: formatDetailsSchema,
  players: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Name is required"),
      teamId: z.number().optional(),
      skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]).optional(),
      category: z.string().optional(),
    })
  ).optional(),
  teams: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Team name is required"),
      players: z.array(z.number()).optional(),
    })
  ).optional(),
  fantasySetup: fantasySetupSchema,
});

type TournamentCreationInput = z.infer<typeof tournamentCreationSchema>;

export default function TournamentCreationFlow() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);

  // Initialize form with react-hook-form and zod resolver
  const methods = useForm<TournamentCreationInput>({
    resolver: zodResolver(tournamentCreationSchema),
    defaultValues: {
      basicDetails: {
        type: "SINGLES",
        maxParticipants: 16,
        entryFee: 0,
        startDate: new Date(),
        endDate: addDays(new Date(), 2),
        registrationOpenDate: new Date(),
        registrationCloseDate: addDays(new Date(), 1),
      },
      formatDetails: {
        isTeamBased: false,
        teamsEnabled: false,
        scoringType: "STANDARD",
        pointsToWin: 11,
        numberOfSets: 1,
        winByTwo: true,
        liveScoring: true,
      },
      players: [],
      teams: [],
      fantasySetup: {
        fantasyEnabled: true,
        contestTypes: [
          {
            name: "Free Entry",
            entryFee: 0,
            maxEntries: 100,
            walletSize: 100000,
            playerCategories: [
              { name: "A Tier", price: 10000 },
              { name: "B Tier", price: 7500 },
              { name: "C Tier", price: 5000 },
              { name: "D Tier", price: 2500 },
            ],
            allowTeamChanges: false,
          },
          {
            name: "Paid Entry",
            entryFee: 500,
            maxEntries: 50,
            walletSize: 150000,
            playerCategories: [
              { name: "A Tier", price: 15000 },
              { name: "B Tier", price: 10000 },
              { name: "C Tier", price: 7500 },
              { name: "D Tier", price: 5000 },
            ],
            allowTeamChanges: true,
            changeFrequency: "DAILY",
            maxPlayersToChange: 2,
          },
        ],
      },
    },
  });

  // Fetch players on mount
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/players");
        if (response.ok) {
          const data = await response.json();
          setAllPlayers(data.players || []);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    fetchPlayers();
  }, []);

  // Handle next step
  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate basic details
      const isValid = await methods.trigger("basicDetails");
      if (!isValid) return;
    } else if (currentStep === 1) {
      // Validate format details
      const isValid = await methods.trigger("formatDetails");
      if (!isValid) return;
    } else if (currentStep === 2) {
      // Validate players
      const isValid = await methods.trigger("players");
      if (!isValid) return;
    } else if (currentStep === 3) {
      // Validate fantasy setup
      const isValid = await methods.trigger("fantasySetup");
      if (!isValid) return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  // Handle back step
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Handle form submission
  const onSubmit = async (data: TournamentCreationInput) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a tournament.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First create the tournament
      const tournamentResponse = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data.basicDetails,
          organizerId: user.id,
        }),
      });

      if (!tournamentResponse.ok) {
        const errorData = await tournamentResponse.json();
        throw new Error(errorData.message || "Failed to create tournament");
      }

      const tournament = await tournamentResponse.json();
      const tournamentId = tournament.id;

      // If teams are enabled, create teams
      if (data.formatDetails.teamsEnabled && data.teams && data.teams.length > 0) {
        const teamsResponse = await fetch(`/api/tournaments/${tournamentId}/teams`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ teams: data.teams }),
        });

        if (!teamsResponse.ok) {
          throw new Error("Failed to create teams");
        }
      }

      // Add players to the tournament
      if (data.players && data.players.length > 0) {
        const playersResponse = await fetch(`/api/tournaments/${tournamentId}/players`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ players: data.players }),
        });

        if (!playersResponse.ok) {
          throw new Error("Failed to add players to tournament");
        }
      }

      // Set up tournament format details
      const formatResponse = await fetch(`/api/tournaments/${tournamentId}/format`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data.formatDetails),
      });

      if (!formatResponse.ok) {
        throw new Error("Failed to set tournament format");
      }

      // Create fantasy contests if enabled
      if (data.fantasySetup.fantasyEnabled && data.fantasySetup.contestTypes && data.fantasySetup.contestTypes.length > 0) {
        const fantasyResponse = await fetch(`/api/tournaments/${tournamentId}/fantasy-setup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ fantasySetup: data.fantasySetup }),
        });

        if (!fantasyResponse.ok) {
          throw new Error("Failed to create fantasy contests");
        }
      }

      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully!",
      });

      // Redirect to the tournament management page
      router.push(`/admin/tournaments/${tournamentId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine progress percentage
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <FormProvider {...methods}>
      <div className="w-full mx-auto max-w-4xl">
        {/* Progress bar and steps indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-sm font-medium">{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-[#00a1e0] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Steps indicator */}
          <div className="flex justify-between mt-6">
            {STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex flex-col items-center ${
                  index === currentStep 
                    ? "text-[#00a1e0]" 
                    : index < currentStep 
                    ? "text-gray-500"
                    : "text-gray-300"
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index === currentStep 
                    ? "border-[#00a1e0] text-[#00a1e0]" 
                    : index < currentStep 
                    ? "border-gray-500 text-white bg-gray-500"
                    : "border-gray-300"
                }`}>
                  {index < currentStep ? (
                    "✓"
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="text-xs mt-1 font-medium">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full mb-8">
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              {/* Step content */}
              {currentStep === 0 && <TournamentBasicDetails />}
              {currentStep === 1 && <TournamentTeamsSetup />}
              {currentStep === 2 && <TournamentPlayersSetup allPlayers={allPlayers} />}
              {currentStep === 3 && <TournamentFantasySetup />}
              {currentStep === 4 && <TournamentReview />}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button 
                type="button" 
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={methods.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-[#00a1e0] hover:bg-[#0072a3]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Tournament
                    <Trophy className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </FormProvider>
  );
}
