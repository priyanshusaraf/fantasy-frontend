"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function TournamentFormat() {
  const { control, watch } = useFormContext();
  const formatType = watch("format.formatType");
  const scoringSystem = watch("format.scoringSystem");

  return (
    <div className="space-y-6">
      {/* Tournament Format Type */}
      <FormField
        control={control}
        name="format.formatType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tournament Format</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select tournament format" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="KNOCKOUT">Knockout / Elimination</SelectItem>
                <SelectItem value="LEAGUE">League Play</SelectItem>
                <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                <SelectItem value="GROUPS_TO_KNOCKOUT">Group Stage to Knockout</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              The overall structure of your tournament
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Match Format */}
      <FormField
        control={control}
        name="format.matchFormat"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Match Format</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select match format" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="BEST_OF_3">Best of 3 Sets</SelectItem>
                <SelectItem value="BEST_OF_5">Best of 5 Sets</SelectItem>
                <SelectItem value="SINGLE_SET">Single Set</SelectItem>
                <SelectItem value="TIME_BASED">Time-based Match</SelectItem>
                <SelectItem value="CUSTOM">Custom Format</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              How individual matches will be structured
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Scoring System */}
      <FormField
        control={control}
        name="format.scoringSystem"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel>Scoring System</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TRADITIONAL" id="traditional" />
                  <Label htmlFor="traditional">Traditional (Games/Sets)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RALLY_POINT" id="rally" />
                  <Label htmlFor="rally">Rally Point System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CUSTOM" id="custom" />
                  <Label htmlFor="custom">Custom Scoring</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormDescription>
              How points will be awarded during matches
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Format specific fields */}
      {formatType === "KNOCKOUT" && (
        <FormField
          control={control}
          name="format.numberOfRounds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Rounds</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Enter number of rounds"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormDescription>
                How many rounds in the knockout stage
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {(formatType === "ROUND_ROBIN" || formatType === "GROUPS_TO_KNOCKOUT") && (
        <>
          <FormField
            control={control}
            name="format.numberOfGroups"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Groups</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter number of groups"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormDescription>
                  How many groups in the group stage
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="format.pointsForWin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points for Win</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Points"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="format.pointsForDraw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points for Draw</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Points"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="format.pointsForLoss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points for Loss</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Points"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}

      {formatType === "GROUPS_TO_KNOCKOUT" && (
        <FormField
          control={control}
          name="format.teamsAdvancingPerGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teams Advancing Per Group</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Enter number of teams"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormDescription>
                How many teams from each group advance to knockout stage
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Optional tournament settings */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium">Additional Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="format.allowTies"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Allow Ties</FormLabel>
                  <FormDescription>
                    Enable matches to end in a tie/draw
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
            control={control}
            name="format.thirdPlaceMatch"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Third Place Match</FormLabel>
                  <FormDescription>
                    Include a match for 3rd/4th place
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="format.seedPlayers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Seed Players/Teams</FormLabel>
                  <FormDescription>
                    Rank participants for balanced matchups
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

      {/* Format Notes */}
      <FormField
        control={control}
        name="format.notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Format Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add any additional notes about the tournament format..."
                {...field}
                value={field.value || ""}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              Optional information about rules, tie-breakers, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 