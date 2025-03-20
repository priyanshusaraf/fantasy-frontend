// src/app/fantasy/contests/[id]/join/page.tsx
"use client";

import React from 'react';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, DollarSign, Info, AlertCircle, Loader2 } from "lucide-react";
import TeamCreationForm from "@/components/fantasy-pickleball/TeamCreationForm";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { toast } from '@/components/ui/sonner';
import FantasyEntryPayment from "@/components/fantasy-pickleball/FantasyEntryPayment";

interface JoinContestPageProps {
  params: {
    id: string;
  };
}

interface Contest {
  id: number;
  name: string;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  currentEntries: number;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  tournament: {
    id: number;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
  };
}

export default function JoinContestPage(props: JoinContestPageProps) {
  // Correctly use React.use for params
  const contestId = String(props.params.id);
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    // Only check authentication after the auth state has loaded
    if (!authLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to sign in page");
      router.push("/auth/signin?callbackUrl=" + encodeURIComponent(`/fantasy/contests/${contestId}/join`));
      return;
    }

    if (!authLoading && isAuthenticated) {
      console.log("User is authenticated, fetching contest data");
      const fetchContest = async () => {
        try {
          console.log(`Fetching contest with ID: ${contestId}`);
          setLoading(true);
          setError(null);
          
          const response = await fetch(
            `/api/fantasy-pickleball/contests/${contestId}`
          );
          
          if (!response.ok) {
            console.error(`Failed to fetch contest: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch contest: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Contest data received:", data);
          
          if (!data.contest) {
            throw new Error("Contest data is missing");
          }
          
          setContest(data.contest);
        } catch (error) {
          console.error("Error in fetchContest:", error);
          setError(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        } finally {
          setLoading(false);
        }
      };

      fetchContest();
    }
  }, [contestId, isAuthenticated, router, authLoading]);

  // Show loading state while auth is being determined
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-4" />
        <h2 className="text-xl font-medium">Checking authentication...</h2>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect handled in useEffect)
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center bg-gray-900">
        <Alert variant="default" className="max-w-md bg-gray-800 border-gray-700 text-white">
          <AlertCircle className="h-4 w-4 text-indigo-400" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to join this fantasy contest.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-4" />
        <h2 className="text-xl font-medium">Loading contest details...</h2>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-900">
        <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Contest not found"}</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4 border-gray-700 text-white hover:bg-gray-800"
          onClick={() => router.push("/fantasy/contests")}
        >
          Back to Contests
        </Button>
      </div>
    );
  }

  // Check if contest can be joined - modified to use tournament start date
  const currentDate = new Date();
  const tournamentStartDate = new Date(contest.tournament.startDate);
  
  // Allow joining if tournament hasn't started yet (regardless of contest status)
  if (currentDate >= tournamentStartDate) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-900">
        <Alert variant="default" className="border-yellow-700 bg-yellow-900/20 text-yellow-300">
          <Info className="h-4 w-4 text-yellow-400" />
          <AlertTitle>Cannot Join Contest</AlertTitle>
          <AlertDescription className="text-yellow-300">
            The tournament for this contest has already started. You can only
            join contests before the tournament begins.
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4 border-gray-700 text-white hover:bg-gray-800"
          onClick={() => router.push("/fantasy/contests")}
        >
          Back to Contests
        </Button>
      </div>
    );
  }

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
    toast("Payment successful! Now you can create your team.");
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-indigo-400">Join Contest</h1>
        <p className="text-gray-400 mt-1">
          {contest.name} - {contest.tournament.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardContent className="p-6 flex items-center">
            <DollarSign className="h-8 w-8 text-indigo-400 mr-4" />
            <div>
              <p className="text-sm text-gray-400">Entry Fee</p>
              <p className="font-medium">
                {contest.entryFee > 0
                  ? `₹${contest.entryFee.toLocaleString()}`
                  : "Free Entry"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardContent className="p-6 flex items-center">
            <Trophy className="h-8 w-8 text-indigo-400 mr-4" />
            <div>
              <p className="text-sm text-gray-400">Prize Pool</p>
              <p className="font-medium">
                ₹{contest.prizePool.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardContent className="p-6 flex items-center">
            <Calendar className="h-8 w-8 text-indigo-400 mr-4" />
            <div>
              <p className="text-sm text-gray-400">Starts On</p>
              <p className="font-medium">
                {new Date(contest.startDate).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entry Fee Alert for paid contests */}
      {contest.entryFee > 0 && (
        <Alert className="mb-8 bg-gray-800 border-gray-700 text-white">
          <Info className="h-4 w-4 text-indigo-400" />
          <AlertTitle>Entry Fee Required</AlertTitle>
          <AlertDescription>
            This is a paid contest. In the first version, payment functionality
            is disabled. Your entry will be processed without requiring payment.
          </AlertDescription>
        </Alert>
      )}

      {/* Show payment component for paid contests if payment isn't complete */}
      {contest.entryFee > 0 && !paymentComplete ? (
        <div className="mb-8 max-w-2xl mx-auto">
          <FantasyEntryPayment 
            tournamentId={contest.tournament.id}
            tournamentName={contest.name}
            entryFee={contest.entryFee}
            contestId={contest.id}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      ) : (
        <TeamCreationForm contestId={contestId} />
      )}
    </div>
  );
}
