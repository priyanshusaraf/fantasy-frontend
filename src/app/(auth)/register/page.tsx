// src/app/(auth)/register/page.tsx
"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RegisterRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
        <p className="mt-4">Loading...</p>
      </div>
    }>
      <RegisterRedirectContent />
    </Suspense>
  );
}

function RegisterRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract any query parameters to pass along
    const callbackUrl = searchParams.get("callbackUrl");
    
    // Use "signup" mode instead of "register" for consistency
    // Both "signup" and "register" are accepted in AuthClientPage
    let redirectUrl = "/auth?mode=signup";

    if (callbackUrl) {
      redirectUrl += `&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }

    console.log(`Redirecting from /register to ${redirectUrl}`);
    
    // Add a small delay to ensure navigation works properly
    setTimeout(() => {
      router.replace(redirectUrl);
    }, 100);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
      <p className="mt-4">Redirecting to registration form...</p>
    </div>
  );
}
