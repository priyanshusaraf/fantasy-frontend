"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TeamCreationForm from "@/components/fantasy-pickleball/TeamCreationForm";

export default function FantasyTeamPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    }>
      <FantasyTeamContent />
    </Suspense>
  );
}

function FantasyTeamContent() {
  const searchParams = useSearchParams();
  const contestId = searchParams.get("contestId") || "";
  
  if (!contestId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error: Missing contest ID</p>
          <p className="text-sm">Please select a contest first to create a team.</p>
        </div>
      </div>
    );
  }
  
  return <TeamCreationForm contestId={contestId} />;
}
