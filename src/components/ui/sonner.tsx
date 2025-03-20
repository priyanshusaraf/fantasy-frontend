"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast as sonnerToast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Custom toast function that safely handles different input types.
 * This prevents the "Objects are not valid as React children" error.
 */
function toast(
  message: string | { title: string; description?: string; [key: string]: any } | unknown
): void {
  // Handle string inputs directly
  if (typeof message === 'string') {
    sonnerToast(message);
    return;
  }
  
  // Handle correctly formatted objects with title and description
  if (message && typeof message === 'object' && 'title' in message) {
    const { title, description, ...options } = message as { title: string; description?: string; [key: string]: any };
    sonnerToast(title, { description, ...options });
    return;
  }
  
  // Safely convert any other input type to string
  try {
    const safeMessage = typeof message === 'object' 
      ? JSON.stringify(message) 
      : String(message);
    sonnerToast(safeMessage);
  } catch (e) {
    // Last resort fallback
    sonnerToast("Notification received");
  }
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        }
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
