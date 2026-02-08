"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header } from "@/components/layout/Header";
import { getSession, clearSession } from "@/lib/auth/utils";
import { validateSession } from "@/lib/auth/validation";
import { logDebug, logInfo, logWarn } from "@/lib/auth/logger";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard layout with ProtectedRoute authentication guard
 * Ensures only authenticated users can access dashboard routes
 * Includes Header component with user info and logout functionality
 *
 * ENHANCED: Validates session on layout mount to detect expired sessions
 * after page refresh
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  // Check session validity on layout mount (critical for page refreshes)
  useEffect(() => {
    const checkSessionOnMount = async () => {
      logDebug('DashboardLayout', 'Checking session on layout mount');

      try {
        const session = await getSession('dashboard-layout-mount');

        if (!session) {
          logWarn('DashboardLayout', 'No session found on layout mount');
          // Let ProtectedRoute handle the redirect
          return;
        }

        // Validate session expiration
        const isValid = validateSession(session);

        if (!isValid) {
          logWarn('DashboardLayout', 'Session expired on layout mount - clearing and redirecting', {
            expiresAt: session.expiresAt,
            currentTime: Math.floor(Date.now() / 1000),
          });

          // Clear expired session
          clearSession();

          // Redirect to signin with message
          router.push('/signin?message=session_expired');
          return;
        }

        logInfo('DashboardLayout', 'Session validated on layout mount', {
          email: session.user.email,
        });
      } catch (error) {
        logWarn('DashboardLayout', 'Error checking session on layout mount', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    checkSessionOnMount();
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
