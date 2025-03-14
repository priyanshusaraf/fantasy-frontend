"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

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

const ContestList: React.FC<ContestListProps> = ({
  tournamentId,
  limit = 5,
  showAll = false,
}) => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

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

        setContests(data.contests);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, [tournamentId, page, limit]);

  const handleJoinContest = (contestId: number) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    router.push(`/fantasy/contests/${contestId}/join`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: Contest["status"]) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contests...</div>;
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No contests available</h3>
        <p className="text-gray-600">Check back later for upcoming contests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {tournamentId ? "Tournament Contests" : "Fantasy Contests"}
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contests.map((contest) => (
          <div
            key={contest.id}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-xl">{contest.name}</h3>
                <span
                  className={`${getStatusColor(
                    contest.status
                  )} px-2 py-1 rounded text-xs font-medium`}
                >
                  {contest.status.replace("_", " ")}
                </span>
              </div>

              <Link
                href={`/tournaments/${contest.tournament.id}`}
                className="text-blue-600 hover:underline"
              >
                {contest.tournament.name}
              </Link>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="font-semibold">Entry Fee:</span>
                  <span className="ml-1">
                    ₹{contest.entryFee.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Prize Pool:</span>
                  <span className="ml-1">
                    ₹{contest.prizePool.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Start:</span>
                  <span className="ml-1">{formatDate(contest.startDate)}</span>
                </div>
                <div>
                  <span className="font-semibold">End:</span>
                  <span className="ml-1">{formatDate(contest.endDate)}</span>
                </div>
              </div>

              <div className="mt-4 bg-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-semibold">Entries:</span>
                    <span className="ml-1">
                      {contest.currentEntries}/{contest.maxEntries}
                    </span>
                  </div>
                  <div className="w-32 bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (contest.currentEntries / contest.maxEntries) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <Link
                  href={`/fantasy/contests/${contest.id}`}
                  className="inline-block text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </Link>

                {contest.status === "UPCOMING" && (
                  <button
                    onClick={() => handleJoinContest(contest.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Join Contest
                  </button>
                )}

                {contest.status === "IN_PROGRESS" && (
                  <Link
                    href={`/fantasy/contests/${contest.id}/leaderboard`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    View Leaderboard
                  </Link>
                )}

                {contest.status === "COMPLETED" && (
                  <Link
                    href={`/fantasy/contests/${contest.id}/results`}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                  >
                    View Results
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md ${
                page === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 text-sm font-medium ${
                    pageNum === page
                      ? "text-blue-600 bg-blue-50 border border-blue-300"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md ${
                page === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {!showAll && contests.length > 0 && (
        <div className="text-center mt-8">
          <Link
            href="/fantasy/contests"
            className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded"
          >
            View All Contests
          </Link>
        </div>
      )}
    </div>
  );
};

export default ContestList;
