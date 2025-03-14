"use client";

import React, { useState } from "react";
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
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const TournamentSchema = z
  .object({
    name: z.string().min(3, "Tournament name must be at least 3 characters"),
    description: z.string().optional(),
    type: TournamentTypeEnum,
    status: TournamentStatusEnum.default("DRAFT"),
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
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((data) => data.registrationCloseDate >= data.registrationOpenDate, {
    message: "Registration close date must be after registration open date",
    path: ["registrationCloseDate"],
  })
  .refine((data) => data.startDate >= data.registrationCloseDate, {
    message: "Tournament must start after registration closes",
    path: ["startDate"],
  });

type CreateTournamentInput = z.infer<typeof TournamentSchema>;

const CreateTournamentForm: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form and zod resolver for validation
  const form = useForm<CreateTournamentInput>({
    resolver: zodResolver(TournamentSchema),
    defaultValues: {
      type: "SINGLES",
      status: "DRAFT",
      maxParticipants: 16,
      entryFee: 0,
      startDate: new Date(),
      // Default tournament end date set to 2 days after start
      endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      registrationOpenDate: new Date(),
      // Default registration close date set to 1 day after open
      registrationCloseDate: new Date(
        new Date().setDate(new Date().getDate() + 1)
      ),
    },
  });

  const onSubmit = async (data: CreateTournamentInput) => {
    // If user is not authenticated, show a toast notification and exit early
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a tournament.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data,
          organizerId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create tournament");
      }

      const tournament = await response.json();

      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully!",
      });

      // Redirect to the tournament management page using the new tournament's id
      router.push(`/admin/manage-tournament?id=${tournament.id}`);
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

  return (
    <Card className="max-w-2xl mx-auto dark:bg-gray-800 dark:text-white">
      <CardHeader>
        <CardTitle>Create New Pickleball Tournament</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tournament Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tournament name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tournament description (optional)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tournament Type */}
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
                        <SelectValue placeholder="Select tournament type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TournamentTypeEnum.options.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Tournament venue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Registration Dates Section */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Registration Open Date */}
              <FormField
                control={form.control}
                name="registrationOpenDate"
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
                            <span className="ml-auto h-4 w-4 opacity-50">
                              📅
                            </span>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-2 dark:bg-gray-800"
                        align="center"
                        sideOffset={8}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date("2100-01-01")
                          }
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
                control={form.control}
                name="registrationCloseDate"
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
                            <span className="ml-auto h-4 w-4 opacity-50">
                              📅
                            </span>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-2 dark:bg-gray-800"
                        align="center"
                        sideOffset={8}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date("2100-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tournament Dates Section */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Tournament Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tournament Start Date</FormLabel>
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
                            <span className="ml-auto h-4 w-4 opacity-50">
                              📅
                            </span>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-2 dark:bg-gray-800"
                        align="center"
                        sideOffset={8}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date("2100-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tournament End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tournament End Date</FormLabel>
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
                            <span className="ml-auto h-4 w-4 opacity-50">
                              📅
                            </span>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-2 dark:bg-gray-800"
                        align="center"
                        sideOffset={8}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date("2100-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tournament Details Section */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Max Participants */}
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Maximum number of participants"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entry Fee */}
              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Fee (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Tournament entry fee"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Prize Money (Optional) */}
            <FormField
              control={form.control}
              name="prizeMoney"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prize Money (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Total prize money"
                      {...field}
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tournament Rules */}
            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Rules</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tournament rules (optional)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tournament Image URL */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/tournament-image.jpg"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a URL for the tournament banner image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Tournament..." : "Create Tournament"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateTournamentForm;
