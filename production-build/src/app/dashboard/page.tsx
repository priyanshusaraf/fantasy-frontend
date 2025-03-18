"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function DashboardRedirector() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role;
      
      // Redirect based on user role
      switch (role) {
        case "PLAYER":
          router.push("/player/dashboard");
          break;
        case "USER":
          router.push("/user/dashboard");
          break;
        case "REFEREE":
          router.push("/referee/dashboard");
          break;
        case "TOURNAMENT_ADMIN":
          router.push("/admin/dashboard");
          break;
        case "MASTER_ADMIN":
          router.push("/master-admin/dashboard");
          break;
        default:
          router.push("/user/dashboard"); // Default fallback
          break;
      }
    }
  }, [status, session, router]);

  // Show loading state while redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-bold">Redirecting to your dashboard...</h1>
    </div>
  );
} 