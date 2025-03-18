import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Scoring | MatchUp",
  description: "Score a match as a referee",
};

export default function MatchScorePage({ params }: { params: { matchId: string } }) {
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Match Scoring</h1>
      <p className="text-xl">Match ID: {params.matchId}</p>
      <p className="text-xl mt-4">Scoring functionality coming soon...</p>
    </div>
  );
}
