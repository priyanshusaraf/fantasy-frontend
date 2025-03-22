"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Define a comprehensive user type to cover all possible properties
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  isApproved?: boolean;
  status?: string;
  username?: string;
}

export default function DashboardRedirector() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const redirectToDashboard = async () => {
      try {
        // Add debugging info
        console.log("Dashboard redirect status:", status, {
          hasSession: !!session,
          user: session?.user ? { 
            hasRole: 'role' in (session.user || {}),
            role: session?.user?.role 
          } : null
        });
        
        // If still loading and not retrying, wait for session
        if (status === "loading" && !isRetrying) {
          return;
        }
        
        // If user is not authenticated, redirect to auth page
        if (status === "unauthenticated") {
          router.push("/auth");
          return;
        }
        
        // First try to get role from session
        if (status === "authenticated" && session?.user) {
          // We have a session but may not have role - check carefully

          // Check for basic user info to verify we have a proper session
          if (!session.user.email) {
            if (retryCount < 3) {
              // Session appears incomplete, retry
              console.log("Session appears incomplete, retrying", { retryCount });
              setIsRetrying(true);
              setRetryCount(prev => prev + 1);
              setTimeout(() => {
                setIsRetrying(false);
              }, 2000); // Wait 2 seconds between retries
              return;
            }
          }

          // Cast to our extended user type
          const user = session.user as ExtendedUser;
          
          // Check for pending approval
          const isPendingApproval = 
            user.status === "PENDING_APPROVAL" || 
            (user.isApproved === false);
          
          if (isPendingApproval) {
            router.push("/approval-pending");
            return;
          }
          
          // If role exists in user object, use it
          if ('role' in user) {
            const role = user.role;
            
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
                // Default to user dashboard
                console.log("Unknown role, defaulting to user dashboard", { role });
                router.push("/user/dashboard");
                break;
            }
            return;
          } else {
            // No role in session, but we have a session
            // Default to user dashboard to prevent loops
            console.log("Session exists but no role found, defaulting to user dashboard");
            router.push("/user/dashboard");
            return;
          }
        }
        
        // If no session role but we have pending retry, just redirect to user dashboard
        if (isRetrying && retryCount > 1) {
          console.log("Falling back to user dashboard due to apparent database issues");
          router.push("/user/dashboard");
          return;
        }
        
        // If no session after timeout, try to retry
        if (retryCount < 3) {
          setIsRetrying(true);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            setIsRetrying(false);
          }, 2000); // Wait 2 seconds between retries
        } else {
          // After 3 retries, fall back to user dashboard
          setError("Could not determine your user role. Redirecting to default dashboard.");
          setTimeout(() => {
            router.push("/user/dashboard");
          }, 3000);
        }
      } catch (err) {
        console.error("Error in dashboard redirection:", err);
        setError("An error occurred while redirecting. You'll be sent to the default dashboard.");
        setTimeout(() => {
          router.push("/user/dashboard");
        }, 3000);
      }
    };

    redirectToDashboard();
  }, [status, session, router, retryCount, isRetrying]);

  // Show loading state with potential error
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <>
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Dashboard Connection Issue</h1>
          <p className="text-center mb-4">{error}</p>
          <Button onClick={() => router.push("/user/dashboard")}>
            Go to Default Dashboard
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <h1 className="text-2xl font-bold text-center">
            {isRetrying ? "Retrying connection..." : "Redirecting to your dashboard..."}
          </h1>
          {retryCount > 0 && (
            <p className="text-amber-500 mt-2">
              Connection attempt {retryCount}/3...
            </p>
          )}
        </>
      )}
    </div>
  );
} 