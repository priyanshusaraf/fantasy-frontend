// src/app/(auth)/login/page.tsx
"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function LoginRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
        <p className="mt-4">Loading...</p>
      </div>
    }>
      <LoginRedirectContent />
    </Suspense>
  );
}

function LoginRedirectContent() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // If the user is authenticated, go directly to dashboard
    if (status === 'authenticated') {
      router.replace('/user/dashboard');
      return;
    }
    
    // If not authenticated or still loading, go to auth page
    if (status === 'unauthenticated') {
      router.replace("/auth?mode=signin");
    }
  }, [router, status, session]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
      <p className="mt-4">Redirecting...</p>
    </div>
  );
}
