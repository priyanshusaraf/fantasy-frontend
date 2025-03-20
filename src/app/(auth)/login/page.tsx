// src/app/(auth)/login/page.tsx
"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

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
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract any query parameters to pass along
    const callbackUrl = searchParams.get("callbackUrl");
    const error = searchParams.get("error");

    let redirectUrl = "/auth?mode=signin";

    if (callbackUrl) {
      redirectUrl += `&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }

    if (error) {
      redirectUrl += `&error=${encodeURIComponent(error)}`;
    }

    // Redirect to the auth page
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
      <p className="mt-4">Redirecting to login...</p>
    </div>
  );
}
