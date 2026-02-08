import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Card component - shadcn/ui style
 * Container for grouped content
 */
export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-shadow duration-200 hover:shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader component
 * Header section of the card
 */
export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CardTitle component
 * Title text in card header
 */
export function CardTitle({ children, className = "", ...props }: CardTitleProps) {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

/**
 * CardDescription component
 * Descriptive text in card header
 */
export function CardDescription({ children, className = "", ...props }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
}

/**
 * CardContent component
 * Main content area of the card
 */
export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}
