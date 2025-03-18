"use client";

import React, { useState, useEffect, FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Calendar, Users, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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

interface ContestListProps {
  tournamentId?: number;
  limit?: number;
  showAll?: boolean;
}

const ContestList: FC<ContestListProps> = ({
  tournamentId,
  limit = 5,
  showAll = false,
}) => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "MASTER_ADMIN" || user?.role === "TOURNAMENT_ADMIN";
  const router = useRouter();
  const [joiningContestId, setJoiningContestId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);

        let url = `/api/fantasy-pickleball/contests?page=${page}&limit=${limit}`;

        if (tournamentId) {
          url += `&tournamentId=${tournamentId}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch contests");
        }

        const data = await res.json();
        console.log("Fetched contests data:", data);

        setContests(data.contests || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Error fetching contests:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, [tournamentId, page, limit]);

  const handleJoinContest = async (contestId: string) => {
    try {
      // Check if user is logged in
      if (!isAuthenticated || !user) {
        console.log("User not authenticated, redirecting to login");
        toast({
          title: "Authentication Required",
          description: "Please log in to join contests",
          variant: "default"
        });
        router.push("/auth/signin?callbackUrl=" + encodeURIComponent(`/fantasy/contests/${contestId}/join`));
        return;
      }
      
      console.log(`Joining contest with ID: ${contestId}`);
      setJoiningContestId(contestId);
      
      // Direct navigation without verification - simplify the flow
      router.push(`/fantasy/contests/${contestId}/join`);
      
    } catch (error) {
      console.error("Error handling join contest:", error);
      toast({
        title: "Error",
        description: "Failed to process join request",
        variant: "destructive"
      });
      setJoiningContestId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: Contest["status"]) => {
    switch (status) {
      case "UPCOMING":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Upcoming</span>
            </div>
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Live</span>
            </div>
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>Completed</span>
            </div>
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Cancelled</span>
            </div>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {String(status).replace(/_/g, " ")}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="ml-3 text-lg font-medium text-white">Loading contests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-900/30 border border-red-800 text-red-300 px-6 py-5 rounded-lg mb-6"
        role="alert"
      >
        <h3 className="font-bold text-lg mb-1">Error Loading Contests</h3>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-3 border-red-800 text-red-300 hover:bg-red-900/30"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold mb-2 text-white">No Contests Available</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Check back later for upcoming contests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-bold text-white">
          {tournamentId ? "Tournament Contests" : "Fantasy Contests"}
        </h2>
        {isAuthenticated && isAdmin && !tournamentId && (
          <Button 
            onClick={() => router.push('/fantasy/contests/create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Create Contest
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contests.map((contest) => (
          <Card 
            key={contest.id}
            className="overflow-hidden transition-all duration-300 hover:shadow-lg bg-gray-800 border-gray-700 hover:border-indigo-700 group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-xl text-white line-clamp-2">{contest.name}</h3>
                {getStatusBadge(contest.status)}
              </div>
              <Link
                href={`/tournaments/${contest.tournament.id}`}
                className="text-indigo-400 hover:underline hover:text-indigo-300 inline-flex items-center text-sm"
              >
                {contest.tournament.name}
              </Link>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-indigo-400">₹{contest.entryFee.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Entry Fee</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-400">₹{contest.prizePool.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Prize Pool</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Start:</span>
                  <span className="font-medium text-white">{formatDate(contest.startDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">End:</span>
                  <span className="font-medium text-white">{formatDate(contest.endDate)}</span>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">
                      {contest.currentEntries}/{contest.maxEntries} Entries
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round((contest.currentEntries / contest.maxEntries) * 100)}% Full
                  </span>
                </div>
                <Progress 
                  value={(contest.currentEntries / contest.maxEntries) * 100} 
                  className={`h-2 bg-gray-700 ${
                    contest.currentEntries / contest.maxEntries > 0.8 
                      ? "[&>div]:bg-red-500" 
                      : contest.currentEntries / contest.maxEntries > 0.5 
                      ? "[&>div]:bg-yellow-500" 
                      : "[&>div]:bg-green-500"
                  }`}
                />
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <Button 
                onClick={() => handleJoinContest(contest.id.toString())}
                disabled={contest.status !== "UPCOMING" || joiningContestId === contest.id.toString()} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all duration-200 transform hover:translate-y-[-2px]"
              >
                {joiningContestId === contest.id.toString() ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  contest.status === "UPCOMING" ? "Join Contest" : "Contest Closed"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(i + 1)}
              className={page === i + 1 ? "glow-effect" : ""}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {!showAll && contests.length >= limit && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => router.push("/fantasy/contests")}
            className="group"
          >
            <span className="group-hover:mr-2 transition-all">View All Contests</span>
            <span className="opacity-0 absolute group-hover:opacity-100 group-hover:relative transition-all">→</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ContestList;
