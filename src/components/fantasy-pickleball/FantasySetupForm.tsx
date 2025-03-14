// src/components/fantasy-pickleball/FantasySetupForm.tsx
"use client";

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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import TeamChangeOptions from "@/components/fantasy-pickleball/TeamChangeOptions";
import { toast } from "sonner";

interface FantasyCategory {
  name: string;
  playerSkillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  price: number;
}

interface FantasySettings {
  teamSize: number;
  walletSize: number;
  allowTeamChanges: boolean;
  changeFrequency: "daily" | "matchday" | "once";
  maxPlayersToChange: number;
  changeWindowStart: string;
  changeWindowEnd: string;
  categories: FantasyCategory[];
  entryFees: {
    free: boolean;
    basic: boolean;
    premium: boolean;
    elite: boolean;
  };
}

interface FantasySetupFormProps {
  tournamentId: string;
}

export default function FantasySetupForm({
  tournamentId,
}: FantasySetupFormProps) {
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
    entryFees: {
      free: true,
      basic: true,
      premium: true,
      elite: true,
    },
  });

  const handleTeamSizeChange = (size: number) => {
    setSettings((prev) => ({ ...prev, teamSize: size }));
  };

  const handleWalletSizeChange = (size: number) => {
    setSettings((prev) => ({ ...prev, walletSize: size }));
  };

  const handleCategoryPriceChange = (index: number, price: number) => {
    const updatedCategories = [...settings.categories];
    updatedCategories[index].price = price;
    setSettings((prev) => ({ ...prev, categories: updatedCategories }));
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

  const handleEntryFeeToggle = (
    fee: "free" | "basic" | "premium" | "elite",
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      entryFees: {
        ...prev.entryFees,
        [fee]: value,
      },
    }));
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

      toast("Fantasy game settings have been saved successfully!");
      router.push(`/tournaments/${tournamentId}/contests`);
    } catch (error) {
      console.error("Error setting up fantasy game:", error);
      toast("Failed to set up fantasy game.");
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[4, 7, 9, 11].map((size) => (
                  <Card
                    key={size}
                    className={`cursor-pointer transition-colors ${
                      settings.teamSize === size
                        ? "border-[#00a1e0] bg-[#00a1e0]/5"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => handleTeamSizeChange(size)}
                  >
                    <CardContent className="flex items-center justify-center p-4">
                      <span className="text-lg font-medium">
                        {size} Players
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-2">
                <Label htmlFor="custom-size">Custom Size</Label>
                <Input
                  id="custom-size"
                  type="number"
                  min="2"
                  max="20"
                  value={
                    ![4, 7, 9, 11].includes(settings.teamSize)
                      ? settings.teamSize
                      : ""
                  }
                  onChange={(e) =>
                    handleTeamSizeChange(parseInt(e.target.value, 10) || 7)
                  }
                  placeholder="Enter custom team size"
                  className="mt-1"
                />
              </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {settings.categories.map((category, index) => (
                  <Card key={index} className="border p-4">
                    <div className="flex items-center mb-3">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        {category.playerSkillLevel}
                      </span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`price-${index}`}>Player Price (₹)</Label>
                      <Input
                        id={`price-${index}`}
                        type="number"
                        min="1000"
                        step="1000"
                        value={category.price}
                        onChange={(e) =>
                          handleCategoryPriceChange(
                            index,
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
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
                Choose which contest categories to create for this tournament
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium">
                        Free Entry
                      </Label>
                      <Switch
                        checked={settings.entryFees.free}
                        onCheckedChange={(checked) =>
                          handleEntryFeeToggle("free", checked)
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      For practice or promotional purposes
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium">
                        Basic (₹500)
                      </Label>
                      <Switch
                        checked={settings.entryFees.basic}
                        onCheckedChange={(checked) =>
                          handleEntryFeeToggle("basic", checked)
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Entry level contests
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium">
                        Premium (₹1000)
                      </Label>
                      <Switch
                        checked={settings.entryFees.premium}
                        onCheckedChange={(checked) =>
                          handleEntryFeeToggle("premium", checked)
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Intermediate level contests
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium">
                        Elite (₹1500)
                      </Label>
                      <Switch
                        checked={settings.entryFees.elite}
                        onCheckedChange={(checked) =>
                          handleEntryFeeToggle("elite", checked)
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      High stakes contests
                    </p>
                  </CardContent>
                </Card>
              </div>
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
