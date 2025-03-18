"use client";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Bell, Moon, Sun, Globe } from "lucide-react";

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  matchUpdates: z.boolean(),
  tournamentAlerts: z.boolean(),
  fantasyReminders: z.boolean(),
  marketingEmails: z.boolean(),
});

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
  reducedMotion: z.boolean(),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      matchUpdates: true,
      tournamentAlerts: true,
      fantasyReminders: true,
      marketingEmails: false,
    },
  });

  const appearanceForm = useForm<z.infer<typeof appearanceSchema>>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: "system",
      fontSize: "medium",
      reducedMotion: false,
    },
  });

  const onNotificationSubmit = async (
    values: z.infer<typeof notificationSchema>
  ) => {
    setIsSubmitting(true);
    try {
      // Simulating API call - would save to user preferences in a real app
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Notification settings updated");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAppearanceSubmit = async (
    values: z.infer<typeof appearanceSchema>
  ) => {
    setIsSubmitting(true);
    try {
      // Simulating API call - would save to user preferences in a real app
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Appearance settings updated");
    } catch (error) {
      console.error("Error updating appearance settings:", error);
      toast.error("Failed to update appearance settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-[#00a1e0]">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          {/* Navigation Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <a
                    href="#notifications"
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </a>
                  <a
                    href="#appearance"
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Appearance</span>
                  </a>
                  <a
                    href="#language"
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Language & Region</span>
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="space-y-8">
            {/* Notification Settings */}
            <Card id="notifications">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Manage how we contact you about fantasy tournaments and
                  matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form
                    onSubmit={notificationForm.handleSubmit(
                      onNotificationSubmit
                    )}
                    className="space-y-6"
                  >
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Email Notifications</FormLabel>
                            <FormDescription>
                              Receive email notifications about your account
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
                      control={notificationForm.control}
                      name="matchUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Match Updates</FormLabel>
                            <FormDescription>
                              Get notified about live match results and updates
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
                      control={notificationForm.control}
                      name="tournamentAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Tournament Alerts</FormLabel>
                            <FormDescription>
                              Get notifications about upcoming tournaments
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
                      control={notificationForm.control}
                      name="fantasyReminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Fantasy Reminders</FormLabel>
                            <FormDescription>
                              Receive reminders to update your fantasy team
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
                      control={notificationForm.control}
                      name="marketingEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Marketing Emails</FormLabel>
                            <FormDescription>
                              Receive promotional emails and offers
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
                    <Button
                      type="submit"
                      className="bg-[#00a1e0] hover:bg-[#0072a3]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Saving..."
                        : "Save Notification Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card id="appearance">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sun className="mr-2 h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the application looks and behaves
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appearanceForm}>
                  <form
                    onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={appearanceForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <div className="flex flex-wrap gap-4 pt-2">
                            <div
                              className={`flex flex-col items-center gap-2 cursor-pointer ${
                                field.value === "light"
                                  ? "opacity-100"
                                  : "opacity-50"
                              }`}
                              onClick={() => field.onChange("light")}
                            >
                              <div className="w-24 h-24 rounded-md bg-white border border-gray-200 shadow-sm p-2 flex items-center justify-center">
                                <Sun className="h-8 w-8 text-yellow-500" />
                              </div>
                              <span className="text-sm font-medium">Light</span>
                            </div>
                            <div
                              className={`flex flex-col items-center gap-2 cursor-pointer ${
                                field.value === "dark"
                                  ? "opacity-100"
                                  : "opacity-50"
                              }`}
                              onClick={() => field.onChange("dark")}
                            >
                              <div className="w-24 h-24 rounded-md bg-gray-900 border border-gray-700 shadow-sm p-2 flex items-center justify-center">
                                <Moon className="h-8 w-8 text-gray-300" />
                              </div>
                              <span className="text-sm font-medium">Dark</span>
                            </div>
                            <div
                              className={`flex flex-col items-center gap-2 cursor-pointer ${
                                field.value === "system"
                                  ? "opacity-100"
                                  : "opacity-50"
                              }`}
                              onClick={() => field.onChange("system")}
                            >
                              <div className="w-24 h-24 rounded-md bg-gradient-to-br from-white to-gray-900 border border-gray-300 shadow-sm p-2 flex items-center justify-center">
                                <div className="flex items-center">
                                  <Sun className="h-6 w-6 text-yellow-500" />
                                  <Moon className="h-6 w-6 text-gray-300 ml-1" />
                                </div>
                              </div>
                              <span className="text-sm font-medium">
                                System
                              </span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={appearanceForm.control}
                      name="fontSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Size</FormLabel>
                          <div className="flex gap-4 pt-2">
                            <Button
                              type="button"
                              variant={
                                field.value === "small" ? "default" : "outline"
                              }
                              className={
                                field.value === "small" ? "bg-[#00a1e0]" : ""
                              }
                              onClick={() => field.onChange("small")}
                            >
                              <span className="text-xs">Small</span>
                            </Button>
                            <Button
                              type="button"
                              variant={
                                field.value === "medium" ? "default" : "outline"
                              }
                              className={
                                field.value === "medium" ? "bg-[#00a1e0]" : ""
                              }
                              onClick={() => field.onChange("medium")}
                            >
                              <span className="text-sm">Medium</span>
                            </Button>
                            <Button
                              type="button"
                              variant={
                                field.value === "large" ? "default" : "outline"
                              }
                              className={
                                field.value === "large" ? "bg-[#00a1e0]" : ""
                              }
                              onClick={() => field.onChange("large")}
                            >
                              <span className="text-base">Large</span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={appearanceForm.control}
                      name="reducedMotion"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Reduced Motion</FormLabel>
                            <FormDescription>
                              Reduce the amount of animations in the interface
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
                    <Button
                      type="submit"
                      className="bg-[#00a1e0] hover:bg-[#0072a3]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Appearance Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Language & Region Settings */}
            <Card id="language">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Language & Region
                </CardTitle>
                <CardDescription>
                  Choose your preferred language and regional settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="kn">Kannada</option>
                      <option value="te">Telugu</option>
                      <option value="ta">Tamil</option>
                    </select>
                    <p className="text-sm text-gray-500">
                      Choose your preferred language for the application
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="Asia/Kolkata">
                        (GMT+5:30) India Standard Time
                      </option>
                      <option value="UTC">
                        (GMT+0:00) Coordinated Universal Time
                      </option>
                      <option value="America/New_York">
                        (GMT-5:00) Eastern Time
                      </option>
                      <option value="Europe/London">
                        (GMT+0:00) Greenwich Mean Time
                      </option>
                      <option value="Asia/Dubai">
                        (GMT+4:00) Gulf Standard Time
                      </option>
                    </select>
                    <p className="text-sm text-gray-500">
                      Match times and dates will be shown in this time zone
                    </p>
                  </div>
                  <Button className="bg-[#00a1e0] hover:bg-[#0072a3]">
                    Save Language & Region Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}

function Label({ children, htmlFor }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}
