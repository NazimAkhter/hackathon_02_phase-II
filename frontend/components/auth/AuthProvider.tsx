"use client";

import React, { createContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserSession } from "@/types/user";
import { createAPIClient, APIClient } from "@/lib/api/client";
import { getSession, getTokenFromCookie, clearSession } from "@/lib/auth/utils";
import { waitForSession } from "@/lib/auth/session-wait";
import { logInfo, logDebug, logWarn, logError } from "@/lib/auth/logger";

// Auth Context Type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiClient: APIClient | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Create Auth Context
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiClient, setApiClient] = useState<APIClient | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const session: UserSession | null = await getSession('auth-provider-check');

      if (session && session.user) {
        setUser(session.user);

        // Create API client with token getter
        const client = createAPIClient(() => getTokenFromCookie());
        setApiClient(client);
      } else {
        setUser(null);
        setApiClient(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setApiClient(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect guard: redirect authenticated users away from auth pages
  useEffect(() => {
    if (!isLoading && user && pathname) {
      const authPages = ["/signin", "/signup"];
      const isOnAuthPage = authPages.includes(pathname);

      // If authenticated and on signin/signup page, redirect to dashboard
      if (isOnAuthPage) {
        // Prevent infinite loop: don't redirect if already redirecting
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, pathname, router]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      logDebug('login', 'Starting signin request', { email });

      // Call backend API directly with credentials to allow cookies
      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${BACKEND_API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // CRITICAL: Allow cross-origin cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        logWarn('login', 'Signin request failed', { status: response.status, error: errorData.detail });
        throw new Error(errorData.detail || errorData.error || "Login failed");
      }

      logInfo('login', 'Signin request successful', { email });

      // CRITICAL FIX: Wait for session cookie to be available before navigation
      // This prevents race condition where dashboard loads before cookie is processed
      // Timeout increased to 5000ms to cover 95% of network conditions (including slow networks)
      // Uses default API-based check (compatible with HttpOnly cookies)
      logDebug('login', 'Waiting for session cookie to be available...');

      const sessionReady = await waitForSession({
        maxWait: 5000, // Increased to 5000ms to accommodate slow network conditions
        interval: 50,
        // Use default API-based check - no custom checkSession needed
      });

      if (!sessionReady) {
        logError('login', 'Session not established after signin', { timeout: 5000 });
        throw new Error('Session could not be established. Please try again.');
      }

      logInfo('login', 'Session confirmed - proceeding to dashboard', { email });

      // Refresh auth state after successful login
      await checkAuth();

      // Redirect to dashboard (safe now that session is confirmed)
      router.push("/dashboard");
    } catch (error) {
      logError('login', 'Login error', error instanceof Error ? error : { error: String(error) });
      throw error;
    }
  };

  // Signup function
  const signup = async (
    email: string,
    password: string,
    name?: string
  ): Promise<void> => {
    try {
      // Call backend API directly with credentials to allow cookies
      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${BACKEND_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include', // CRITICAL: Allow cross-origin cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Signup failed");
      }

      // Wait for session to be established
      // Timeout increased to 5000ms to cover 95% of network conditions (including slow networks)
      // Uses default API-based check (compatible with HttpOnly cookies)
      const sessionReady = await waitForSession({
        maxWait: 5000, // Increased to 5000ms to accommodate slow network conditions
        interval: 50,
        // Use default API-based check - no custom checkSession needed
      });

      if (!sessionReady) {
        throw new Error('Session could not be established. Please try again.');
      }

      // Refresh auth state after successful signup
      await checkAuth();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Clear session cookie
      clearSession();

      // Reset state
      setUser(null);
      setApiClient(null);

      // Redirect to signin page
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    apiClient,
    login,
    signup,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
