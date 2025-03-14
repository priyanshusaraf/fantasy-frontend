"use client";

import React from "react";
import { useRouter } from "next/navigation";
import LiveScoring from "@/components/live-scoring/LiveScoring";
import { useAuth } from "@/hooks/useAuth";

interface LiveScoringPageProps {
  params: {
    id: string;
  };
}

export default function LiveScoringPage({ params }: LiveScoringPageProps) {
  const matchId = parseInt(params.id);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Check if user is authenticated and has referee role
  const isUserReferee = isAuthenticated && user?.role === "REFEREE";

  // If not authenticated or not a referee, redirect to login
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "REFEREE") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !isUserReferee) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <LiveScoring matchId={matchId} isReferee={true} />
    </div>
  );
}
