import React from "react";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty state component displayed when no data is available
 * Shows a message with optional icon and call-to-action
 */
export function EmptyState({
  message,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <p className="text-gray-600 text-lg mb-4">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
