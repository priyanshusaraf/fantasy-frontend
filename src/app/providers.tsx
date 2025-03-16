// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, render without ThemeProvider to avoid hydration mismatch
  if (!mounted) {
    return (
      <SessionProvider refetchInterval={1800} refetchOnWindowFocus={true}>
        {children}
      </SessionProvider>
    );
  }

  // Only render ThemeProvider on the client
  return (
    <SessionProvider 
      refetchInterval={1800} // Refresh session every 30 minutes (in seconds)
      refetchOnWindowFocus={true} // Refresh when window gains focus
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--card-foreground)',
              border: '1px solid var(--border)',
            },
            className: 'overflow-hidden rounded-lg shadow-lg',
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
