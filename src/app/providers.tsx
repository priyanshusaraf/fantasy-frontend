// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);
    
    // Polyfill for CustomEvent for older browsers (IE11, etc.)
    if (typeof window !== 'undefined' && typeof window.CustomEvent !== 'function') {
      console.log('Adding CustomEvent polyfill for older browsers');
      
      window.CustomEvent = function(event: string, params?: CustomEventInit) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles || false, params.cancelable || false, params.detail || null);
        return evt;
      } as any;
      
      (window.CustomEvent as any).prototype = window.Event.prototype;
    }
  }, []);

  // During SSR, render without ThemeProvider to avoid hydration mismatch
  if (!mounted) {
    return (
      <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
        {children}
      </SessionProvider>
    );
  }

  // Only render ThemeProvider on the client
  return (
    <SessionProvider 
      refetchInterval={0} // Disable automatic refresh to avoid async issues
      refetchOnWindowFocus={false} // Disable refresh on window focus to prevent errors
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        forcedTheme="dark"
        disableTransitionOnChange={false}
      >
        {children}
        <Toaster 
          position="top-right"
          closeButton
          richColors
          theme="dark"
          toastOptions={{
            // Custom toast component to handle objects safely
            unstyled: true,
            className: "bg-background text-foreground border border-border rounded-md p-4 shadow-lg",
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
