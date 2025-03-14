// src/components/fantasy/FantasySetupForm.tsx
import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamSizeSelector } from "@/components/fantasy/TeamSizeSelector";
import { CategoryPriceSettings } from "@/components/fantasy/CategoryPriceSettings";
import { EntryFeeOptions } from "@/components/fantasy/EntryFeeOptions";
import { TeamChangeOptions } from "@/components/fantasy/TeamChangeOptions";
import {
  FantasySettings,
  FantasyCategory,
  FantasyEntryFee,
} from "@/types/fantasy";
import { toast } from "@/components/ui/sonner";

interface FantasySetupFormProps {
  tournamentId: string;
}

export function FantasySetupForm({ tournamentId }: FantasySetupFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Default fantasy settings
  const [settings, setSettings] = useState<FantasySettings>({
    teamSize: 7,
    walletSize: 100000,
    allowTeamChanges: true,
    changeFrequency: "daily",
    maxPlayersToChange: 2,
    changeWindowStart: "18:00",
    changeWindowEnd: "22:00",
    categories: [
      { name: "A Grade", playerSkillLevel: "PROFESSIONAL", price: 15000 },
      { name: "B Grade", playerSkillLevel: "ADVANCED", price: 10000 },
      { name: "C Grade", playerSkillLevel: "INTERMEDIATE", price: 7000 },
      { name: "D Grade", playerSkillLevel: "BEGINNER", price: 5000 },
    ],
    entryFees: [
      { amount: 0, isEnabled: true }, // Free
      { amount: 500, isEnabled: true }, // Basic
      { amount: 1000, isEnabled: true }, // Premium
      { amount: 1500, isEnabled: true }, // Elite
    ],
  });

  const handleTeamSizeChange = (size: number) => {
    setSettings((prev) => ({ ...prev, teamSize: size }));
  };

  const handleWalletSizeChange = (size: number) => {
    setSettings((prev) => ({ ...prev, walletSize: size }));
  };

  const handleAllowTeamChangesToggle = (allow: boolean) => {
    setSettings((prev) => ({ ...prev, allowTeamChanges: allow }));
  };

  const handleChangeFrequencyChange = (
    frequency: "daily" | "matchday" | "once"
  ) => {
    setSettings((prev) => ({ ...prev, changeFrequency: frequency }));
  };

  const handleMaxPlayersToChangeUpdate = (max: number) => {
    setSettings((prev) => ({ ...prev, maxPlayersToChange: max }));
  };

  const handleChangeWindowUpdate = (start: string, end: string) => {
    setSettings((prev) => ({
      ...prev,
      changeWindowStart: start,
      changeWindowEnd: end,
    }));
  };

  const handleCategoriesUpdate = (categories: FantasyCategory[]) => {
    setSettings((prev) => ({ ...prev, categories }));
  };

  const handleEntryFeesUpdate = (entryFees: FantasyEntryFee[]) => {
    setSettings((prev) => ({ ...prev, entryFees }));
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/fantasy-setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set up fantasy game");
      }

      toast({
        title: "Success",
        description: "Fantasy game settings have been saved successfully.",
      });

      router.push(`/tournaments/${tournamentId}`);
    } catch (error) {
      console.error("Error setting up fantasy game:", error);
      toast({
        title: "Error",
        description: "Failed to set up fantasy game.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-[#00a1e0]">
          Set Up Fantasy Game
        </CardTitle>
        <CardDescription>
          Configure your fantasy game settings for this tournament
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-2 block">
                Team Size Configuration
              </Label>
              <p className="text-sm text-gray-500 mb-4">
                Select how many players users can add to their fantasy teams
              </p>
              <TeamSizeSelector
                options={[4, 7, 9, 11]}
                selectedSize={settings.teamSize}
                onSelect={handleTeamSizeChange}
              />
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium mb-2 block">
                Wallet Size
              </Label>
              <p className="text-sm text-gray-500 mb-4">
                Set the virtual currency amount for users to spend on players
              </p>
              <Input
                type="number"
                min={10000}
                step={5000}
                className="max-w-xs"
                value={settings.walletSize}
                onChange={(e) => handleWalletSizeChange(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-2">
                Recommended: ₹100,000
              </p>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium mb-2 block">
                Player Categories & Pricing
              </Label>
              <p className="text-sm text-gray-500 mb-4">
                Set prices for players based on their skill levels
              </p>
              <CategoryPriceSettings
                categories={settings.categories}
                onCategoryChange={handleCategoriesUpdate}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-2 block">
                Team Changes Configuration
              </Label>
              <p className="text-sm text-gray-500 mb-4">
                Specify if and how users can modify their teams during the
                tournament
              </p>
              <TeamChangeOptions
                allowTeamChanges={settings.allowTeamChanges}
                changeFrequency={settings.changeFrequency}
                maxPlayersToChange={settings.maxPlayersToChange}
                changeWindowStart={settings.changeWindowStart}
                changeWindowEnd={settings.changeWindowEnd}
                onAllowTeamChangesToggle={handleAllowTeamChangesToggle}
                onChangeFrequencyChange={handleChangeFrequencyChange}
                onMaxPlayersToChangeUpdate={handleMaxPlayersToChangeUpdate}
                onChangeWindowUpdate={handleChangeWindowUpdate}
              />
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium mb-2 block">
                Entry Fee Options
              </Label>
              <p className="text-sm text-gray-500 mb-4">
                Configure the entry fee options for your fantasy contests
              </p>
              <EntryFeeOptions
                fees={settings.entryFees}
                onFeesChange={handleEntryFeesUpdate}
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        {step > 1 ? (
          <Button variant="outline" onClick={prevStep}>
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        )}

        {step < 2 ? (
          <Button
            className="bg-[#00a1e0] hover:bg-[#0072a3]"
            onClick={nextStep}
          >
            Next
          </Button>
        ) : (
          <Button
            className="bg-[#00a1e0] hover:bg-[#0072a3]"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Settings"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
