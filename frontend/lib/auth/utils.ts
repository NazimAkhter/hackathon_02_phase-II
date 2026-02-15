// Auth utility functions for session management

import { JWTPayload, User, UserSession } from "@/types/user";
import { logDebug, logError, logWarn, logAuthEvent } from "./logger";
import { validateSession } from "./validation";

/**
 * Session state tracker for detecting state changes across navigation
 * Tracks the last known session state to detect transitions
 */
let lastSessionState: {
  exists: boolean;
  isValid: boolean;
  email: string | null;
  expiresAt: number | null;
  timestamp: number;
} | null = null;

/**
 * Track session state changes for navigation stability monitoring
 *
 * Detects and logs important session state transitions:
 * - Session appears (null → valid)
 * - Session disappears (valid → null)
 * - Session expires (valid → expired)
 * - Session restored (expired → valid)
 *
 * @param currentSession - Current session state
 * @param context - Context where session was checked (e.g., 'navigation', 'page-mount', 'refresh')
 */
function trackSessionStateChange(
  currentSession: UserSession | null,
  context: string
): void {
  const currentState = {
    exists: currentSession !== null,
    isValid: currentSession ? validateSession(currentSession) : false,
    email: currentSession?.user.email || null,
    expiresAt: currentSession?.expiresAt || null,
    timestamp: Date.now(),
  };

  // First time tracking - establish baseline
  if (!lastSessionState) {
    lastSessionState = currentState;
    logAuthEvent('session_state_initialized', {
      context,
      exists: currentState.exists,
      isValid: currentState.isValid,
      email: currentState.email,
    });
    return;
  }

  // Detect state transitions
  const stateChanged =
    lastSessionState.exists !== currentState.exists ||
    lastSessionState.isValid !== currentState.isValid ||
    lastSessionState.email !== currentState.email;

  if (stateChanged) {
    // Log the specific transition
    if (!lastSessionState.exists && currentState.exists) {
      logAuthEvent('session_appeared', {
        context,
        email: currentState.email,
        expiresAt: currentState.expiresAt,
        timeSinceLastCheck: currentState.timestamp - lastSessionState.timestamp,
      });
    } else if (lastSessionState.exists && !currentState.exists) {
      logAuthEvent('session_disappeared', {
        context,
        previousEmail: lastSessionState.email,
        timeSinceLastCheck: currentState.timestamp - lastSessionState.timestamp,
      });
    } else if (lastSessionState.isValid && !currentState.isValid) {
      logAuthEvent('session_expired', {
        context,
        email: currentState.email,
        expiresAt: currentState.expiresAt,
        currentTime: Math.floor(Date.now() / 1000),
        timeSinceLastCheck: currentState.timestamp - lastSessionState.timestamp,
      });
    } else if (!lastSessionState.isValid && currentState.isValid) {
      logAuthEvent('session_restored', {
        context,
        email: currentState.email,
        expiresAt: currentState.expiresAt,
        timeSinceLastCheck: currentState.timestamp - lastSessionState.timestamp,
      });
    } else if (lastSessionState.email !== currentState.email) {
      logAuthEvent('session_user_changed', {
        context,
        previousEmail: lastSessionState.email,
        newEmail: currentState.email,
        timeSinceLastCheck: currentState.timestamp - lastSessionState.timestamp,
      });
    }
  }

  // Update last known state
  lastSessionState = currentState;
}

/**
 * Get current session from Better Auth with retry logic
 *
 * CRITICAL: With HttpOnly cookies, we cannot read the JWT token via document.cookie.
 * Instead, we call the backend /api/auth/session endpoint. The browser automatically
 * includes HttpOnly cookies in the request, and the backend validates them.
 *
 * **Navigation Stability Enhancement**:
 * - Tracks session state changes across navigation
 * - Logs session persistence patterns
 * - Detects session transitions (valid → expired, present → missing)
 *
 * **Timing Contract**:
 * - Initial attempt: API call to backend /api/auth/session (~100-500ms)
 * - If fails on first attempt: Wait 500ms and retry once
 * - Maximum total time: ~1000ms (initial + retry)
 *
 * @param context - Optional context for logging (e.g., 'navigation', 'page-mount', 'refresh')
 * @returns UserSession if valid session exists, null otherwise
 */
export async function getSession(context: string = 'unknown'): Promise<UserSession | null> {
  const maxRetries = 1;
  const retryDelay = 500; // milliseconds

  // Log navigation context
  logDebug('getSession', `Session check initiated`, { context });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logDebug('getSession', `Attempt ${attempt + 1}/${maxRetries + 1}`, { context });

      // Call backend session endpoint
      // The browser automatically includes HttpOnly cookies in the request
      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nazimbotexpert-todo-app.hf.space';
      const response = await fetch(`${BACKEND_API_URL}/api/auth/session`, {
        method: 'GET',
        credentials: 'include', // CRITICAL: Include HttpOnly cookies
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (attempt < maxRetries) {
          logDebug('getSession', 'Session check failed, will retry', {
            context,
            attempt: attempt + 1,
            retryDelay,
            status: response.status,
          });
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        logDebug('getSession', 'Session check failed after retries', {
          context,
          status: response.status,
        });

        // Track session state change (session disappeared)
        trackSessionStateChange(null, context);

        return null;
      }

      // Parse session data from response
      const data = await response.json();

      if (!data.user || !data.token || !data.expiresAt) {
        logWarn('getSession', 'Invalid session response format', { context });
        trackSessionStateChange(null, context);
        return null;
      }

      logDebug('getSession', 'Session retrieved from backend', {
        context,
        userId: data.user.id,
        email: data.user.email,
        expiresAt: data.expiresAt,
      });

      // Build session object
      const user: User = {
        id: data.user.id,
        email: data.user.email,
      };

      const session: UserSession = {
        user,
        token: data.token,
        expiresAt: data.expiresAt,
      };

      // Validate session expiration
      const isValid = validateSession(session);

      if (!isValid) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = data.expiresAt - currentTime;

        logWarn('getSession', 'Session expired', {
          context,
          expiresAt: data.expiresAt,
          currentTime,
          expiredBy: Math.abs(timeUntilExpiry),
        });

        // Track session state change (session expired)
        trackSessionStateChange(session, context);

        return null;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = data.expiresAt - currentTime;

      logDebug('getSession', 'Valid session found', {
        context,
        email: user.email,
        expiresIn: timeUntilExpiry,
      });

      // Track session state change (session valid/restored)
      trackSessionStateChange(session, context);

      return session;

    } catch (error) {
      logError('getSession', 'Error retrieving session', {
        context,
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt < maxRetries) {
        logDebug('getSession', 'Retrying after error', {
          context,
          attempt: attempt + 1,
          retryDelay
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      trackSessionStateChange(null, context);
      return null;
    }
  }

  trackSessionStateChange(null, context);
  return null;
}

/**
 * Extract JWT token from cookies with comprehensive debug logging
 *
 * @returns JWT token string or null if not found
 */
export function getTokenFromCookie(): string | null {
  // Server-side rendering: no cookies available
  if (typeof window === "undefined") {
    logDebug('getTokenFromCookie', 'Server-side context - no cookies available');
    return null;
  }

  try {
    const allCookies = document.cookie;
    logDebug('getTokenFromCookie', 'Reading cookies', {
      hasCookies: allCookies.length > 0,
      cookieCount: allCookies.split(';').filter(c => c.trim()).length,
    });

    if (!allCookies) {
      logDebug('getTokenFromCookie', 'No cookies found in document.cookie');
      return null;
    }

    // Parse cookies
    const cookies = allCookies.split(";");
    const sessionCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("better-auth.session.token=")
    );

    if (!sessionCookie) {
      logDebug('getTokenFromCookie', 'Session cookie not found', {
        availableCookies: cookies.map(c => c.trim().split('=')[0]),
      });
      return null;
    }

    logDebug('getTokenFromCookie', 'Session cookie found');

    // Extract token value
    const token = sessionCookie.split("=")[1]?.trim();

    if (!token) {
      logWarn('getTokenFromCookie', 'Session cookie exists but token is empty');
      return null;
    }

    logDebug('getTokenFromCookie', 'Token extracted successfully', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
    });

    return token;

  } catch (error) {
    logError('getTokenFromCookie', 'Error reading cookie', error instanceof Error ? error : { error: String(error) });
    return null;
  }
}

/**
 * Decode JWT token and extract user information
 * WARNING: This does not verify the token signature!
 * Token verification happens on the backend.
 */
export function getUserFromToken(token: string): JWTPayload | null {
  logDebug('getUserFromToken', 'Starting token decode', {
    tokenLength: token.length,
  });

  try {
    // JWT structure: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      logWarn('getUserFromToken', 'Invalid JWT structure', {
        parts: parts.length,
        expected: 3,
      });
      return null;
    }

    // Decode base64 payload (middle part)
    const payload = parts[1];
    const decodedPayload = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );

    // Extract user information from payload
    // Backend uses "userId" (camelCase), not "user_id" (snake_case)
    const jwtPayload: JWTPayload = {
      user_id: decodedPayload.userId || decodedPayload.user_id || decodedPayload.sub,
      email: decodedPayload.email,
      exp: decodedPayload.exp,
      iat: decodedPayload.iat,
    };

    logDebug('getUserFromToken', 'Token decoded successfully', {
      userId: jwtPayload.user_id,
      email: jwtPayload.email,
      exp: jwtPayload.exp,
      iat: jwtPayload.iat,
    });

    return jwtPayload;
  } catch (error) {
    logError('getUserFromToken', 'Failed to decode token', error instanceof Error ? error : { error: String(error) });
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(exp: number): boolean {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const isExpired = now >= exp;

  logDebug('isTokenExpired', 'Checking token expiration', {
    currentTime: now,
    expiresAt: exp,
    isExpired,
    timeUntilExpiry: exp - now,
  });

  return isExpired;
}

/**
 * Clear session (remove cookie)
 */
export function clearSession(): void {
  logDebug('clearSession', 'Clearing session cookie');

  if (typeof window === "undefined") {
    logDebug('clearSession', 'Server-side context - cannot clear cookie');
    return;
  }

  // Set cookie with past expiration date to delete it
  // IMPORTANT: Must match all attributes used when setting the cookie
  // Including SameSite=None and Secure for cross-origin cookies
  document.cookie =
    "better-auth.session.token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";

  logDebug('clearSession', 'Session cookie cleared successfully');
}

/**
 * Extract returnUrl from URL search params
 */
export function getReturnUrl(searchParams: URLSearchParams | string): string | null {
  logDebug('getReturnUrl', 'Extracting returnUrl from search params', {
    paramsType: typeof searchParams,
  });

  let returnUrl: string | null = null;

  if (typeof searchParams === "string") {
    const params = new URLSearchParams(searchParams);
    returnUrl = params.get("returnUrl");
  } else {
    returnUrl = searchParams.get("returnUrl");
  }

  logDebug('getReturnUrl', 'ReturnUrl extracted', {
    returnUrl: returnUrl || 'null',
  });

  return returnUrl;
}

/**
 * Validate and sanitize returnUrl to prevent open redirect vulnerabilities
 * Only allows paths starting with '/' (same-origin redirects)
 */
export function getSafeReturnUrl(returnUrl: string | null): string {
  logDebug('getSafeReturnUrl', 'Validating and sanitizing returnUrl', {
    returnUrl: returnUrl || 'null',
  });

  // Default to dashboard if no returnUrl provided
  if (!returnUrl) {
    logDebug('getSafeReturnUrl', 'No returnUrl provided, using default', {
      defaultUrl: '/dashboard',
    });
    return "/dashboard";
  }

  // Security: Only allow relative paths starting with '/'
  // This prevents open redirect attacks (e.g., redirecting to external sites)
  if (!returnUrl.startsWith("/")) {
    logWarn('getSafeReturnUrl', 'Invalid returnUrl detected (not a relative path)', {
      returnUrl,
      defaultUrl: '/dashboard',
    });
    return "/dashboard";
  }

  // Prevent protocol-relative URLs (e.g., //evil.com)
  if (returnUrl.startsWith("//")) {
    logWarn('getSafeReturnUrl', 'Invalid returnUrl detected (protocol-relative URL)', {
      returnUrl,
      defaultUrl: '/dashboard',
    });
    return "/dashboard";
  }

  logDebug('getSafeReturnUrl', 'ReturnUrl validated successfully', {
    safeReturnUrl: returnUrl,
  });

  return returnUrl;
}
