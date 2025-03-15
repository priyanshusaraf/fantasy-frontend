"use client";

import TeamCreationForm from "@/components/fantasy-pickleball/TeamCreationForm";

export default function FantasyTeamPage() {
  // For example, you might pass a contestId from the URL or hard-code for now
  const contestId = "1";
  return <TeamCreationForm contestId={contestId} />;
}
