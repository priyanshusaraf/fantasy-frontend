"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import DirectPlayerAddForm from "@/components/tournaments/DirectPlayerAddForm";

export default function AddPlayerToTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;
  const { data: session, status } = useSession();

  // Check if user is authorized
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "TOURNAMENT_ADMIN" && session?.user?.role !== "MASTER_ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  // Handle success
  const handleSuccess = () => {
    // Navigate back to tournament details
    router.push(`/admin/tournaments/${tournamentId}?tab=players`);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournament
        </Button>
      </div>

      <DirectPlayerAddForm 
        tournamentId={tournamentId}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </div>
  );
} 