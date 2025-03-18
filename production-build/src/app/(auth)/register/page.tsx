// src/app/(auth)/register/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RegisterRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract any query parameters to pass along
    const callbackUrl = searchParams.get("callbackUrl");

    let redirectUrl = "/auth?mode=register";

    if (callbackUrl) {
      redirectUrl += `&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }

    // Redirect to the auth page
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
      <p className="mt-4">Redirecting to registration...</p>
    </div>
  );
}
