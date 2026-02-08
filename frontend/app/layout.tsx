import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Todo App - Manage Your Tasks",
  description: "A modern todo application with authentication and persistent storage",
};

/**
 * Root Layout - Application Shell
 *
 * **Session Validation Strategy (T023 Analysis)**:
 * This layout does NOT implement additional session validation because:
 *
 * 1. **AuthProvider** (wrapping all children) validates session on mount via checkAuth()
 *    - Runs getSession('auth-provider-check') when app initializes
 *    - Establishes authentication state for entire application
 *    - Updates on signin/signup/logout events
 *
 * 2. **Middleware** (/frontend/middleware.ts) validates on every navigation
 *    - Intercepts all requests to protected routes (/dashboard/*)
 *    - Validates JWT token expiration before page renders
 *    - Redirects to signin if session invalid/expired
 *
 * 3. **Page-level validation** in dashboard components
 *    - Dashboard layout validates on mount (dashboard-layout-mount)
 *    - Dashboard page validates on mount (dashboard-page-mount)
 *    - Periodic checks every 60 seconds during active use
 *
 * **Navigation Tracking**:
 * Session state changes across navigation are tracked via:
 * - getSession() context parameters (e.g., 'dashboard-page-mount', 'auth-provider-check')
 * - trackSessionStateChange() in /frontend/lib/auth/utils.ts
 * - logAuthEvent() for session transitions (appeared, disappeared, expired, restored)
 *
 * **Result**: Adding validation here would be redundant and impact performance.
 * The existing multi-layer approach ensures session stability across all navigation patterns.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
