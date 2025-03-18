import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | MatchUp",
  description: "View the leaderboard for all fantasy contests",
};

export default function LeaderboardPage() {
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Leaderboard</h1>
      <p className="text-xl">Coming soon...</p>
    </div>
  );
}
