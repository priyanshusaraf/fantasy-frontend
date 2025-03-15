"use client";

import ScorePage from "@/components/referee/ScorePage";

export default function RefereeScorePage({
  params,
}: {
  params: { matchId: string };
}) {
  return <ScorePage matchId={params.matchId} />;
}
