"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Player skill levels from the database schema
const PLAYER_SKILL_LEVELS = [
  { value: "A_PLUS", label: "A+" },
  { value: "A", label: "A" },
  { value: "A_MINUS", label: "A-" },
  { value: "B_PLUS", label: "B+" },
  { value: "B", label: "B" },
  { value: "B_MINUS", label: "B-" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

// Form schema validation
const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["USER", "PLAYER", "REFEREE", "TOURNAMENT_ADMIN", "MASTER_ADMIN"]),
  skillLevel: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  autoApprove: z.boolean().default(true),
  sendEmail: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(
  (data) => !(data.role === "PLAYER" && !data.skillLevel),
  {
    message: "Skill level is required for player accounts",
    path: ["skillLevel"],
  }
);

type FormValues = z.infer<typeof formSchema>;

export default function InviteUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      role: "USER",
      skillLevel: "",
      password: "",
      confirmPassword: "",
      autoApprove: true,
      sendEmail: true,
    },
  });

  const watchRole = form.watch("role");
  const isPlayerRole = watchRole === "PLAYER";

  // Check if user is admin and redirect if not
  if (status === "unauthenticated") {
    router.push("/auth");
  }

  if (status === "authenticated" && 
      session?.user?.role !== "MASTER_ADMIN" && 
      session?.user?.role !== "TOURNAMENT_ADMIN") {
    router.push("/dashboard");
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          role: data.role,
          skillLevel: data.role === "PLAYER" ? data.skillLevel : undefined,
          password: data.password,
          autoApprove: data.autoApprove,
          sendEmail: data.sendEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to create user");
      }

      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      // Reset form and redirect to users page
      form.reset();
      router.push("/admin/users");
      
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 flex items-center"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to User Management
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#00a1e0]">Create New User</CardTitle>
          <CardDescription>
            Create a new user account with initial password
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form id="create-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter username" />
                      </FormControl>
                      <FormDescription>
                        This will be their display name in the app
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email address" />
                      </FormControl>
                      <FormDescription>
                        They'll use this email to sign in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Create a password" />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Confirm the password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2"
                        >
                          <div className="space-y-2 border rounded-md p-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="USER" id="user-option" />
                              <Label htmlFor="user-option" className="font-medium">
                                Fantasy Player
                              </Label>
                            </div>
                            <p className="text-sm text-gray-500 pl-6">
                              Can participate in fantasy leagues
                            </p>
                          </div>

                          <div className="space-y-2 border rounded-md p-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="PLAYER" id="player-option" />
                              <Label htmlFor="player-option" className="font-medium">
                                Tournament Player
                              </Label>
                            </div>
                            <p className="text-sm text-gray-500 pl-6">
                              Can participate in tournaments
                            </p>
                          </div>

                          <div className="space-y-2 border rounded-md p-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="REFEREE" id="referee-option" />
                              <Label htmlFor="referee-option" className="font-medium">
                                Referee
                              </Label>
                            </div>
                            <p className="text-sm text-gray-500 pl-6">
                              Can manage matches and record results
                            </p>
                          </div>

                          <div className="space-y-2 border rounded-md p-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="TOURNAMENT_ADMIN" id="tournament-admin-option" />
                              <Label htmlFor="tournament-admin-option" className="font-medium">
                                Tournament Admin
                              </Label>
                            </div>
                            <p className="text-sm text-gray-500 pl-6">
                              Can create and manage tournaments
                            </p>
                          </div>

                          {session?.user?.role === "MASTER_ADMIN" && (
                            <div className="space-y-2 border rounded-md p-3 hover:bg-gray-50">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="MASTER_ADMIN" id="master-admin-option" />
                                <Label htmlFor="master-admin-option" className="font-medium">
                                  Master Admin
                                </Label>
                              </div>
                              <p className="text-sm text-gray-500 pl-6">
                                Full system access and control
                              </p>
                            </div>
                          )}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isPlayerRole && (
                  <FormField
                    control={form.control}
                    name="skillLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select skill level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLAYER_SKILL_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          For matchmaking and tournament categorization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <FormField
                    control={form.control}
                    name="autoApprove"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Auto-approve account</FormLabel>
                          <FormDescription>
                            User will be approved automatically
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sendEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Send email notification</FormLabel>
                          <FormDescription>
                            Notify user by email with credentials
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="create-user-form" 
            disabled={isSubmitting}
            className="bg-[#00a1e0] hover:bg-[#0072a3]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 