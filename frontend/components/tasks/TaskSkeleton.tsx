"use client";

import React from "react";

/**
 * TaskSkeleton component
 * Shows animated loading skeleton for task list items
 * Displays 5 skeleton items by default to match typical task list
 */
export function TaskSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg"
          aria-hidden="true"
        >
          {/* Checkbox skeleton */}
          <div className="h-5 w-5 rounded border-2 border-gray-200 bg-gray-100 animate-pulse flex-shrink-0" />

          {/* Title skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-2 flex-shrink-0">
            <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-14 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
