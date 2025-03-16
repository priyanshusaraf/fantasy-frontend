"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import the LandingPage component with no SSR to prevent hydration issues with Three.js
const LandingPage = dynamic(
  () => import("@/components/landing/LandingPage"),
  { ssr: false }
);

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#010615] text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4f46e5] mb-4"></div>
          <p className="text-[#a4b4ef]">Loading amazing experience...</p>
        </div>
      </div>
    }>
      <LandingPage />
    </Suspense>
  );
}
