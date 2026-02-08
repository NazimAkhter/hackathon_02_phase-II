"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "fullscreen";
}

/**
 * LoadingSpinner component
 * Displays a loading spinner with different sizes and variants
 */
export function LoadingSpinner({ size = "md", variant = "inline" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const spinner = (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-primary border-t-transparent ${sizeClasses[size]}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
