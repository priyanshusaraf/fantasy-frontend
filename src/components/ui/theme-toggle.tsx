"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/Button"
import { Moon, Sun, SunMoon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Force dark mode
    document.documentElement.classList.add('dark')
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("rounded-full w-10 h-10", className)}
        disabled
      >
        <SunMoon className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  // Since we're forcing dark mode in this app version, this button
  // is now just decorative and doesn't change the theme
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full w-10 h-10 relative overflow-hidden transition-all", 
        "bg-transparent hover:bg-accent/10",
        className
      )}
      aria-label="Theme toggle"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Moon className="h-5 w-5 text-blue-400" />
        </motion.div>
      </div>
      <span className="sr-only">Dark mode enabled</span>
    </Button>
  )
} 