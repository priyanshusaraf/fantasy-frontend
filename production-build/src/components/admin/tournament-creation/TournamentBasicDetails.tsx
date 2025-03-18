"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const tournamentTypes = [
  { id: "SINGLES", label: "Singles" },
  { id: "DOUBLES", label: "Doubles" },
  { id: "MIXED_DOUBLES", label: "Mixed Doubles" },
  { id: "ROUND_ROBIN", label: "Round Robin" },
  { id: "KNOCKOUT", label: "Knockout" },
  { id: "LEAGUE", label: "League" },
];

export default function TournamentBasicDetails() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Tournament Name */}
      <FormField
        control={control}
        name="basicDetails.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tournament Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter tournament name" {...field} />
            </FormControl>
            <FormDescription>
              Give your tournament a memorable name
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={control}
        name="basicDetails.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your tournament..."
                {...field}
                value={field.value || ""}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              Provide details about the tournament format, prizes, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tournament Type */}
      <FormField
        control={control}
        name="basicDetails.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tournament Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select tournament type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {tournamentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              The type of tournament determines the match structure
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Location */}
      <FormField
        control={control}
        name="basicDetails.location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input placeholder="Tournament venue" {...field} />
            </FormControl>
            <FormDescription>
              Where will the tournament take place?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Date */}
        <FormField
          control={control}
          name="basicDetails.startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
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
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date */}
        <FormField
          control={control}
          name="basicDetails.endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
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
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Open Date */}
        <FormField
          control={control}
          name="basicDetails.registrationOpenDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Registration Opens</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
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
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Registration Close Date */}
        <FormField
          control={control}
          name="basicDetails.registrationCloseDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Registration Closes</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
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
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Max Participants */}
        <FormField
          control={control}
          name="basicDetails.maxParticipants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Participants</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={2}
                  placeholder="Enter max participants"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Maximum number of players allowed in the tournament
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Entry Fee */}
        <FormField
          control={control}
          name="basicDetails.entryFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entry Fee (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="Enter entry fee"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Fee to enter the tournament (0 for free entry)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Prize Money */}
      <FormField
        control={control}
        name="basicDetails.prizeMoney"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Prize Money (₹)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                placeholder="Enter prize money"
                {...field}
                value={field.value || ""}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
              />
            </FormControl>
            <FormDescription>
              Total prize pool for tournament winners (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tournament Rules */}
      <FormField
        control={control}
        name="basicDetails.rules"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tournament Rules</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter tournament rules and guidelines..."
                {...field}
                value={field.value || ""}
                className="min-h-[150px]"
              />
            </FormControl>
            <FormDescription>
              Specify any rules, guidelines, or code of conduct for participants
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Image URL */}
      <FormField
        control={control}
        name="basicDetails.imageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tournament Banner Image URL</FormLabel>
            <FormControl>
              <Input
                placeholder="https://example.com/image.jpg"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              URL to an image that represents your tournament (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Custom button component for calendar popover
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "bg-[#00a1e0] text-white hover:bg-[#0072a3]",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 py-2 px-4",
        variantClasses[variant],
        className
      )}
      ref={ref}
      {...props}
    />
  );
}); 