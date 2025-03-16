"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  className?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

    return (
      <div
        ref={ref}
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        {...props}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)

Progress.displayName = "Progress"

export { Progress } 