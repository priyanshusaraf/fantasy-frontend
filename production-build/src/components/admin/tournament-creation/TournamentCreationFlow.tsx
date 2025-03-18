"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

// Import Step Components
import TournamentBasicDetails from "./TournamentBasicDetails";
import TournamentFormat from "./TournamentFormat";
import PlayersSetup from "./PlayersSetup";
import FantasySetup from "./FantasySetup";
import ReviewStep from "./ReviewStep";

// UI Components
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Steps, Step } from "@/components/ui/steps";
import { useToast } from "@/components/ui/use-toast";

// Define tournament creation steps
const steps = [
  { id: "basicDetails", label: "Basic Details" },
  { id: "format", label: "Tournament Format" },
  { id: "players", label: "Players & Teams" },
  { id: "fantasy", label: "Fantasy Setup" },
  { id: "review", label: "Review & Submit" },
];

// Form schemas for each step
const basicDetailsSchema = z.object({
  name: z.string().min(3, { message: "Tournament name must be at least 3 characters" }),
  description: z.string().optional(),
  type: z.string(),
  location: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  registrationOpenDate: z.date().optional(),
  registrationCloseDate: z.date().optional(),
  maxParticipants: z.number().int().positive().optional(),
  entryFee: z.number().min(0).optional(),
  prizeMoney: z.number().min(0).optional(),
  rules: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  status: z.string().default("DRAFT"),
});

const formatSchema = z.object({
  formatType: z.string(),
  matchFormat: z.string(),
  scoringSystem: z.string(),
  // Other fields are conditional based on format type
  numberOfRounds: z.number().int().positive().optional(),
  numberOfGroups: z.number().int().positive().optional(),
  teamsPerGroup: z.number().int().positive().optional(),
  teamsAdvancingPerGroup: z.number().int().positive().optional(),
  knockoutRounds: z.number().int().positive().optional(),
  pointsForWin: z.number().int().min(0).optional(),
  pointsForDraw: z.number().int().min(0).optional(),
  pointsForLoss: z.number().int().min(0).optional(),
  tiebreakers: z.array(z.string()).optional(),
  allowTies: z.boolean().optional(),
  thirdPlaceMatch: z.boolean().optional(),
  seedPlayers: z.boolean().optional(),
  notes: z.string().optional(),
});

const playersSchema = z.object({
  registrationMode: z.string(),
  individuals: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      skillLevel: z.number().int().optional(),
      notes: z.string().optional(),
      isConfirmed: z.boolean().optional(),
    })
  ).optional(),
  teams: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      players: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
      })),
      captain: z.object({
        id: z.string().optional(),
        name: z.string(),
      }).optional(),
      notes: z.string().optional(),
    })
  ).optional(),
  autoAssignPlayers: z.boolean().optional(),
  allowPlayerSwitching: z.boolean().optional(),
});

const fantasySchema = z.object({
  enableFantasy: z.boolean().optional(),
  fantasyPoints: z.string().optional(),
  autoPublish: z.boolean().optional(),
  customPoints: z.object({
    win: z.number().optional(),
    pointWon: z.number().optional(),
    ace: z.number().optional(),
    error: z.number().optional(),
  }).optional(),
  contests: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      entryFee: z.number().min(0),
      maxEntries: z.number().int().positive(),
      totalPrize: z.number().min(0),
      prizeBreakdown: z.array(
        z.object({
          position: z.number().int().positive(),
          percentage: z.number().min(0).max(100),
        })
      ),
      rules: z.object({
        captainMultiplier: z.number().min(1),
        viceCaptainMultiplier: z.number().min(1),
        maxPlayersPerTeam: z.number().int().positive().optional(),
        maxPlayersFromSameTeam: z.number().int().positive().optional(),
        teamSize: z.number().int().positive(),
        substitutionsAllowed: z.number().int().min(0).optional(),
      }).optional(),
      description: z.string().optional(),
    })
  ).optional(),
});

// Combined schema for the entire form
const tournamentSchema = z.object({
  basicDetails: basicDetailsSchema,
  format: formatSchema,
  players: playersSchema,
  fantasy: fantasySchema,
});

// TypeScript type for the form data
type TournamentFormData = z.infer<typeof tournamentSchema>;

export default function TournamentCreationFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  // Initialize form with default values
  const methods = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      basicDetails: {
        status: "DRAFT",
      },
      fantasy: {
        enableFantasy: false,
        autoPublish: false,
      },
      players: {
        registrationMode: "ADMIN_ONLY",
        individuals: [],
        teams: [],
        autoAssignPlayers: false,
        allowPlayerSwitching: false,
      },
    },
    mode: "onChange",
  });
  
  const { handleSubmit, trigger, formState: { errors } } = methods;
  
  // Navigate to next step after validation
  const handleNext = async () => {
    const currentStepId = steps[currentStep].id;
    const isValid = await trigger(currentStepId as any);
    
    if (isValid) {
      window.scrollTo(0, 0);
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors before proceeding.",
        variant: "destructive",
      });
    }
  };
  
  // Go to previous step
  const handlePrevious = () => {
    window.scrollTo(0, 0);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };
  
  // Jump to a specific step
  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };
  
  // Submit the form
  const onSubmit = async (data: TournamentFormData) => {
    try {
      setIsSubmitting(true);
      
      // Make API request to create tournament
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }
      
      const result = await response.json();
      
      toast({
        title: "Tournament Created",
        description: "Your tournament has been successfully created.",
      });
      
      // Convert numeric ID to string if needed
      const tournamentId = result.id ? String(result.id) : (result.tournamentId ? String(result.tournamentId) : '');
      
      // Redirect to the tournament management page with the correct tournament ID
      router.push(`/admin/tournaments/${tournamentId}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle saving as draft
  const handleSaveAsDraft = async () => {
    try {
      setIsSubmitting(true);
      
      const formData = methods.getValues();
      formData.basicDetails.status = "DRAFT";
      
      // Make API request to save draft
      const response = await fetch('/api/tournaments/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save draft');
      }
      
      const result = await response.json();
      
      toast({
        title: "Draft Saved",
        description: "Your tournament draft has been saved successfully.",
      });
      
      // Optionally redirect after saving draft
      // router.push('/tournaments/drafts');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render the current step's form
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <TournamentBasicDetails />;
      case 1:
        return <TournamentFormat />;
      case 2:
        return <PlayersSetup />;
      case 3:
        return <FantasySetup />;
      case 4:
        return <ReviewStep onEditSection={(section) => {
          const stepIndex = steps.findIndex(step => step.id === section);
          if (stepIndex !== -1) {
            goToStep(stepIndex);
          }
        }} />;
      default:
        return null;
    }
  };
  
  return (
    <FormProvider {...methods}>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Create Tournament</h1>
        
        <Steps currentStep={currentStep} className="mb-8">
          {steps.map((step, index) => (
            <Step 
              key={step.id} 
              label={step.label} 
              onClick={() => index < currentStep && goToStep(index)} 
              clickable={index < currentStep} 
            />
          ))}
        </Steps>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg border p-6 mb-6">
            {renderStepContent()}
          </div>
          
          <div className="flex justify-between items-center mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveAsDraft}
                    disabled={isSubmitting}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Tournament'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
} 