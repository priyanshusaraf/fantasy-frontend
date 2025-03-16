"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LiveScoring from "@/components/live-scoring/LiveScoring";
import { useAuth } from "@/hooks/useAuth";

interface LiveScoringPageProps {
  params: {
    id: string;
  };
}

export default function LiveScoringPage({ params }: LiveScoringPageProps) {
  const matchId = parseInt(params.id, 10);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Check authentication and referee role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "REFEREE") {
      router.push("/dashboard");
    } else {
      setLoadingAuth(false);
    }
  }, [isAuthenticated, user, router]);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <p className="text-lg font-medium">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LiveScoring matchId={matchId} isReferee={true} />
    </div>
  );
}
