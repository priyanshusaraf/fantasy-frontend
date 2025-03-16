"use client";

import { useSearchParams } from "next/navigation";
import TeamCreationForm from "@/components/fantasy-pickleball/TeamCreationForm";

export default function FantasyTeamPage() {
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
