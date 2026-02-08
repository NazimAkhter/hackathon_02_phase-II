import React from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Reusable button component with loading state and variants
 */
export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 hover:opacity-90 focus:ring-blue-500 active:bg-blue-800",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 hover:opacity-90 focus:ring-gray-500 active:bg-gray-400",
    danger:
      "bg-red-600 text-white hover:bg-red-700 hover:opacity-90 focus:ring-red-500 active:bg-red-800",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm min-h-[44px]",
    md: "px-4 py-2 text-base min-h-[44px]",
    lg: "px-6 py-3 text-lg min-h-[48px]",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}
