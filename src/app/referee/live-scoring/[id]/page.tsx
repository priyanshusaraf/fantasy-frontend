"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import SimplifiedScoring from "@/components/live-scoring/SimplifiedScoring";

interface LiveScoringPageProps {
  params: {
    id: string;
  };
}

export default function LiveScoringPage({ params }: LiveScoringPageProps) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to be determined
    if (status === "loading") return;

    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    // Verify the user is a referee
    if (session && session.user.role !== "REFEREE") {
      router.push("/unauthorized");
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SimplifiedScoring matchId={parseInt(id)} isReferee={true} />
    </div>
  );
}
