import React from "react";
import ContestList from "@/components/fantasy-pickleball/ContestList";

export const metadata = {
  title: "Fantasy Pickleball Contests",
  description: "Browse and join fantasy pickleball contests.",
};

export default function ContestsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Fantasy Pickleball Contests</h1>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="font-bold text-lg">1</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Join a Contest</h3>
              <p className="text-gray-600">
                Choose from various entry fee levels and join contests for
                tournaments.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="font-bold text-lg">2</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Build Your Team</h3>
              <p className="text-gray-600">
                Select players within your budget. Choose a captain (2x points)
                and vice-captain (1.5x points).
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="font-bold text-lg">3</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Win Prizes</h3>
              <p className="text-gray-600">
                Earn points based on your players performance. Top performers
                win prize money!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Special Rules:</strong> If a player wins a game by 11-0,
                they get 15 points extra. If they win by less than 5 points,
                they get 10 points extra. In knockout stages, points are
                multiplied by 1.5x.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
            <h2 className="text-white text-xl font-bold">Featured Contests</h2>
          </div>
          <div className="p-6">
            <ContestList limit={3} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">All Contests</h2>
        <ContestList showAll={true} limit={9} />
      </div>
    </div>
  );
}
