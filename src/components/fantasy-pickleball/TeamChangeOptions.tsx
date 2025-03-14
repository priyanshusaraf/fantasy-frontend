// src/components/fantasy-pickleball/TeamChangeOptions.tsx
"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/Input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TeamChangeOptionsProps {
  allowTeamChanges: boolean;
  changeFrequency: "daily" | "matchday" | "once";
  maxPlayersToChange: number;
  changeWindowStart: string;
  changeWindowEnd: string;
  onAllowTeamChangesToggle: (allow: boolean) => void;
  onChangeFrequencyChange: (frequency: "daily" | "matchday" | "once") => void;
  onMaxPlayersToChangeUpdate: (max: number) => void;
  onChangeWindowUpdate: (start: string, end: string) => void;
}

export default function TeamChangeOptions({
  allowTeamChanges,
  changeFrequency,
  maxPlayersToChange,
  changeWindowStart,
  changeWindowEnd,
  onAllowTeamChangesToggle,
  onChangeFrequencyChange,
  onMaxPlayersToChangeUpdate,
  onChangeWindowUpdate,
}: TeamChangeOptionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          checked={allowTeamChanges}
          onCheckedChange={onAllowTeamChangesToggle}
          id="allow-changes"
        />
        <Label htmlFor="allow-changes">
          Allow team changes during tournament
        </Label>
      </div>

      {allowTeamChanges && (
        <>
          <div className="pl-6 pt-4 space-y-6">
            <div className="space-y-2">
              <Label>How often can users change their teams?</Label>
              <RadioGroup
                value={changeFrequency}
                onValueChange={(v) =>
                  onChangeFrequencyChange(v as "daily" | "matchday" | "once")
                }
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily">Daily</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="matchday" id="matchday" />
                  <Label htmlFor="matchday">Between match days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="once" id="once" />
                  <Label htmlFor="once">Once during tournament</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-players">
                Maximum players that can be changed
              </Label>
              <Input
                id="max-players"
                type="number"
                min="1"
                max="11"
                value={maxPlayersToChange}
                onChange={(e) =>
                  onMaxPlayersToChangeUpdate(parseInt(e.target.value, 10))
                }
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500">
                How many players can be swapped per change window
              </p>
            </div>

            <div className="space-y-2">
              <Label>Change window time</Label>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <Label htmlFor="start-time">Start time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={changeWindowStart}
                    onChange={(e) =>
                      onChangeWindowUpdate(e.target.value, changeWindowEnd)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={changeWindowEnd}
                    onChange={(e) =>
                      onChangeWindowUpdate(changeWindowStart, e.target.value)
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Time window when users are allowed to make changes (24-hour
                format)
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
