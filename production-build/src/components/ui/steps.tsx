"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number;
}

export function Steps({ currentStep, className, ...props }: StepsProps) {
  const childrenArray = React.Children.toArray(props.children);
  const steps = childrenArray.map((step, index) => {
    return React.cloneElement(step as React.ReactElement, {
      completed: currentStep > index,
      active: currentStep === index,
      position: index,
    });
  });

  return (
    <div
      className={cn("flex items-center w-full", className)}
      {...props}
    >
      {steps}
    </div>
  );
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  position?: number;
  active?: boolean;
  completed?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export function Step({
  label,
  position = 0,
  active = false,
  completed = false,
  clickable = false,
  onClick,
  className,
  ...props
}: StepProps) {
  const isFirst = position === 0;
  const displayPosition = position + 1;

  return (
    <div
      className={cn(
        "flex items-center space-x-2 flex-1",
        !isFirst && "ml-4",
        className
      )}
      {...props}
    >
      <div className="flex-1 h-px bg-muted-foreground/30" hidden={isFirst} />
      <button
        type="button"
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          active && "border-primary bg-primary text-primary-foreground",
          completed && "border-primary bg-primary text-primary-foreground",
          !active && !completed && "border-muted-foreground/30 text-muted-foreground",
          clickable && "cursor-pointer hover:bg-muted",
          !clickable && "cursor-default"
        )}
        onClick={clickable ? onClick : undefined}
        aria-label={`Step ${displayPosition}: ${label}`}
      >
        {completed ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <span>{displayPosition}</span>
        )}
      </button>
      <div className="flex-1 h-px bg-muted-foreground/30" />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-medium",
            active && "text-foreground",
            completed && "text-foreground",
            !active && !completed && "text-muted-foreground"
          )}
        >
          {label}
        </div>
      </div>
    </div>
  );
} 