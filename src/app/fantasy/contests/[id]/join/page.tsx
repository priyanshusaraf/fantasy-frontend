// src/app/fantasy/contests/[id]/join/page.tsx
"use client";

import React, { useEffect, useState } from "react";
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
import { Calendar, Trophy, DollarSign, Info } from "lucide-react";
import { TeamCreationForm } from "@/components/fantasy-pickleball/TeamCreationForm";
import { useAuth } from "@/hooks/useAuth";

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

export default function JoinContestPage({ params }: JoinContestPageProps) {
  const contestId = params.id;
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchContest = async () => {
      try {
        const response = await fetch(
          `/api/fantasy-pickleball/contests/${contestId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch contest");
        }
        const data = await response.json();
        setContest(data.contest);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [contestId, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Redirect handled in useEffect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        Loading contest details...
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Contest not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if contest can be joined
  if (contest.status !== "UPCOMING") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>Cannot Join Contest</AlertTitle>
          <AlertDescription>
            This contest has already started or has been completed. You can only
            join upcoming contests.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#00a1e0]">Join Contest</h1>
        <p className="text-gray-600 mt-1">
          {contest.name} - {contest.tournament.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center">
            <DollarSign className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Entry Fee</p>
              <p className="font-medium">
                {contest.entryFee > 0
                  ? `₹${contest.entryFee.toLocaleString()}`
                  : "Free Entry"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <Trophy className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Prize Pool</p>
              <p className="font-medium">
                ₹{contest.prizePool.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <Calendar className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Starts On</p>
              <p className="font-medium">
                {new Date(contest.startDate).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entry Fee Alert for paid contests */}
      {contest.entryFee > 0 && (
        <Alert className="mb-8 bg-[#fff5fc]">
          <Info className="h-4 w-4" />
          <AlertTitle>Entry Fee Required</AlertTitle>
          <AlertDescription>
            This is a paid contest. In the first version, payment functionality
            is disabled. Your entry will be processed without requiring payment.
          </AlertDescription>
        </Alert>
      )}

      <TeamCreationForm contestId={contestId} />
    </div>
  );
}
