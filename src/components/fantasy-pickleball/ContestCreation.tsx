import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { CalendarIcon, Trophy, Users, DollarSign, AlertCircle } from 'lucide-react';

const ContestSchema = z.object({
  name: z.string().min(3, { message: "Contest name must be at least 3 characters" }),
  description: z.string().optional(),
  entryFee: z.coerce.number().min(0, { message: "Entry fee must be a positive number" }),
  maxEntries: z.coerce.number().min(2, { message: "Contest must allow at least 2 entries" }),
  prizePool: z.coerce.number().min(0, { message: "Prize pool must be a positive number" }),
  startDate: z.date(),
  endDate: z.date(),
  isPublic: z.boolean().default(true),
  allowMultipleEntries: z.boolean().default(false),
  maxEntriesPerUser: z.coerce.number().min(1).optional(),
  guaranteedPrizePool: z.boolean().default(false),
});

interface ContestCreationProps {
  tournamentId: string;
  tournamentName: string;
  tournamentStartDate: Date;
  tournamentEndDate: Date;
  onSuccess?: (contestId: string) => void;
}

export function ContestCreation({
  tournamentId,
  tournamentName,
  tournamentStartDate,
  tournamentEndDate,
  onSuccess,
}: ContestCreationProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prizeDistribution, setPrizeDistribution] = useState<{ rank: number; percentage: number }[]>([
    { rank: 1, percentage: 50 },
    { rank: 2, percentage: 30 },
    { rank: 3, percentage: 20 },
  ]);
  
  const form = useForm<z.infer<typeof ContestSchema>>({
    resolver: zodResolver(ContestSchema),
    defaultValues: {
      name: `${tournamentName} Fantasy Contest`,
      description: `Fantasy contest for ${tournamentName}`,
      entryFee: 10,
      maxEntries: 100,
      prizePool: 900,
      startDate: tournamentStartDate,
      endDate: tournamentEndDate,
      isPublic: true,
      allowMultipleEntries: false,
      maxEntriesPerUser: 1,
      guaranteedPrizePool: false,
    },
  });
  
  const watchEntryFee = form.watch('entryFee');
  const watchMaxEntries = form.watch('maxEntries');
  const watchPrizePool = form.watch('prizePool');
  const watchAllowMultipleEntries = form.watch('allowMultipleEntries');
  
  // Calculate organizer fee
  const calculateOrganizerFee = () => {
    const totalEntryFees = watchEntryFee * watchMaxEntries;
    return totalEntryFees - watchPrizePool;
  };
  
  // Calculate fee percentage
  const calculateFeePercentage = () => {
    const totalEntryFees = watchEntryFee * watchMaxEntries;
    if (totalEntryFees === 0) return 0;
    return ((totalEntryFees - watchPrizePool) / totalEntryFees) * 100;
  };
  
  // Update prize pool when entry fee or max entries change
  React.useEffect(() => {
    const totalEntryFees = watchEntryFee * watchMaxEntries;
    const feePercentage = 10; // 10% platform fee
    const suggestedPrizePool = Math.floor(totalEntryFees * (1 - feePercentage / 100));
    
    form.setValue('prizePool', suggestedPrizePool);
  }, [watchEntryFee, watchMaxEntries, form]);
  
  const onSubmit = async (data: z.infer<typeof ContestSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Validate dates
      if (data.startDate > data.endDate) {
        toast.error("Start date cannot be after end date");
        return;
      }
      
      // Validate prize distribution
      const totalPercentage = prizeDistribution.reduce((sum, item) => sum + item.percentage, 0);
      if (totalPercentage !== 100) {
        toast.error("Prize distribution must total 100%");
        return;
      }
      
      // Create contest payload
      const contestPayload = {
        ...data,
        tournamentId,
        prizeDistribution,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      };
      
      // API call would go here
      console.log("Creating contest:", contestPayload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Contest created successfully!");
      
      if (onSuccess) {
        onSuccess("new-contest-id");
      } else {
        router.push(`/tournaments/${tournamentId}/contests`);
      }
    } catch (error) {
      console.error("Error creating contest:", error);
      toast.error("Failed to create contest. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updatePrizeDistribution = (rank: number, percentage: number) => {
    const newDistribution = [...prizeDistribution];
    const index = newDistribution.findIndex(item => item.rank === rank);
    
    if (index !== -1) {
      newDistribution[index].percentage = percentage;
    }
    
    setPrizeDistribution(newDistribution);
  };
  
  const addPrizeRank = () => {
    const nextRank = prizeDistribution.length + 1;
    setPrizeDistribution([...prizeDistribution, { rank: nextRank, percentage: 0 }]);
  };
  
  const removePrizeRank = (rank: number) => {
    setPrizeDistribution(prizeDistribution.filter(item => item.rank !== rank));
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Fantasy Contest</CardTitle>
        <CardDescription>
          Set up a new fantasy contest for {tournamentName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="settings">Contest Settings</TabsTrigger>
                <TabsTrigger value="prizes">Prize Structure</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contest Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Brief description of your contest
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
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
                              disabled={(date) =>
                                date < new Date() || date < tournamentStartDate || date > tournamentEndDate
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
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
                              disabled={(date) =>
                                date < new Date() || date > tournamentEndDate
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
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Fee ($)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>
                          Cost to enter this contest
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxEntries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Entries</FormLabel>
                        <FormControl>
                          <Input type="number" min="2" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum number of teams allowed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Public Contest</FormLabel>
                        <FormDescription>
                          Make this contest visible to all users
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
                  control={form.control}
                  name="allowMultipleEntries"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Allow Multiple Entries</FormLabel>
                        <FormDescription>
                          Let users create multiple teams for this contest
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
                
                {watchAllowMultipleEntries && (
                  <FormField
                    control={form.control}
                    name="maxEntriesPerUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Entries Per User</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum number of teams a single user can create
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="prizes" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prizePool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prize Pool ($)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>
                          Total amount to be distributed as prizes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="guaranteedPrizePool"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Guaranteed Prize Pool</FormLabel>
                          <FormDescription>
                            Prize pool is guaranteed even if contest doesn't fill
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
                
                <div className="rounded-lg border p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">Prize Distribution</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPrizeRank}
                    >
                      Add Prize Rank
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {prizeDistribution.map((prize) => (
                      <div key={prize.rank} className="flex items-center gap-3">
                        <div className="w-12 flex-shrink-0">
                          <Badge variant="outline" className="w-full">
                            #{prize.rank}
                          </Badge>
                        </div>
                        <div className="flex-grow">
                          <Slider
                            value={[prize.percentage]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value: number[]) => updatePrizeDistribution(prize.rank, value[0])}
                          />
                        </div>
                        <div className="w-16 text-right">
                          {prize.percentage}%
                        </div>
                        <div className="w-20 text-right text-sm">
                          ${(watchPrizePool * prize.percentage / 100).toFixed(2)}
                        </div>
                        {prize.rank > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePrizeRank(prize.rank)}
                            className="h-8 w-8"
                          >
                            &times;
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-sm text-muted-foreground">
                    Total: {prizeDistribution.reduce((sum, item) => sum + item.percentage, 0)}%
                    {prizeDistribution.reduce((sum, item) => sum + item.percentage, 0) !== 100 && (
                      <span className="text-red-500 ml-2">
                        (Must equal 100%)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-medium mb-2">Contest Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Entry Fee: ${watchEntryFee}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Max Entries: {watchMaxEntries}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span>Prize Pool: ${watchPrizePool}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Platform Fee: {calculateFeePercentage().toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <CardFooter className="flex justify-between px-0">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Contest"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 