import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <div>
        <Link href="/">Home</Link>
      </div>
      <div className="space-x-4">
        <Link href="/referee/create-match">Create Match</Link>
        <Link href="/referee/live-scoring/123">Live Scoring</Link>
        <Link href="/fantasy/team">Fantasy Team</Link>
        <Link href="/leaderboard">Leaderboards</Link>
        {/* Add other links as necessary */}
      </div>
    </nav>
  );
}
