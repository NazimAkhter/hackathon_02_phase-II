/**
 * Session polling utility for race condition handling
 *
 * Provides waitForSession() function to poll for session availability
 * after signin, preventing race conditions where navigation happens
 * before the browser finishes processing the Set-Cookie header.
 */

import { logDebug, logWarn } from './logger';

export interface WaitForSessionOptions {
  /**
   * Maximum wait time in milliseconds
   * @default 3000
   */
  maxWait?: number;

  /**
   * Polling interval in milliseconds
   * @default 50
   */
  interval?: number;

  /**
   * Custom session check function
   * If not provided, checks for cookie existence
   * @returns true if session is available
   */
  checkSession?: () => Promise<boolean>;
}

/**
 * Default session check: verifies session via API call
 *
 * IMPORTANT: Cannot use document.cookie to check for HttpOnly cookies!
 * HttpOnly cookies are not accessible via JavaScript (security feature).
 * Instead, we make an API call - the browser automatically includes
 * HttpOnly cookies in the request.
 *
 * @returns true if session is valid (API call succeeds)
 */
async function defaultCheckSession(): Promise<boolean> {
  if (typeof document === 'undefined') {
    return false; // Server-side, no cookies available
  }

  try {
    // Call the session endpoint to verify session
    // The browser automatically includes HttpOnly cookies in the request
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/auth/session`, {
      method: 'GET',
      credentials: 'include', // CRITICAL: Include cookies in request
      headers: {
        'Accept': 'application/json',
      },
    });

    // Session is valid if we get a 200 OK response
    return response.ok;
  } catch (error) {
    logWarn('defaultCheckSession', 'Session check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Wait for session to become available after signin
 *
 * Polls for session availability with configurable timeout and interval.
 * This solves the race condition where signin completes but the browser
 * hasn't finished processing the Set-Cookie header yet.
 *
 * **Timing Guarantees**:
 * - First check: Immediate (0ms)
 * - Subsequent checks: Every 50ms (default)
 * - Maximum attempts: 20 (with 1000ms timeout and 50ms interval)
 * - Typical resolution: 50-150ms
 *
 * @param options - Configuration options for polling behavior
 * @returns Promise<boolean> - true if session available within timeout, false otherwise
 *
 * @example
 * ```typescript
 * // After successful signin API call
 * const sessionReady = await waitForSession({ maxWait: 1000 });
 *
 * if (sessionReady) {
 *   router.push('/dashboard'); // Safe to navigate
 * } else {
 *   console.error('Session not established after signin');
 *   // Handle failure: show error or retry
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom session check (using getSession)
 * import { getSession } from '@/lib/auth/utils';
 *
 * const sessionReady = await waitForSession({
 *   maxWait: 2000,
 *   interval: 100,
 *   checkSession: async () => {
 *     const session = await getSession();
 *     return session !== null;
 *   }
 * });
 * ```
 */
export async function waitForSession(
  options: WaitForSessionOptions = {}
): Promise<boolean> {
  const {
    maxWait = 5000,
    interval = 50,
    checkSession = defaultCheckSession,
  } = options;

  const startTime = Date.now();
  let attempts = 0;

  logDebug('waitForSession', 'Starting session polling', {
    maxWait,
    interval,
  });

  while (Date.now() - startTime < maxWait) {
    attempts++;

    try {
      const sessionAvailable = await checkSession();

      logDebug('waitForSession', `Attempt ${attempts}`, {
        sessionAvailable,
        elapsed: Date.now() - startTime,
      });

      if (sessionAvailable) {
        logDebug('waitForSession', 'Session available', {
          attempts,
          elapsed: Date.now() - startTime,
        });
        return true;
      }
    } catch (error) {
      logWarn('waitForSession', 'Session check failed', {
        error: error instanceof Error ? error.message : String(error),
        attempts,
      });
      // Continue polling even if check fails
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // Timeout exceeded
  logWarn('waitForSession', 'Timeout exceeded - session not available', {
    attempts,
    elapsed: Date.now() - startTime,
    maxWait,
  });

  return false;
}

/**
 * Wait for session with exponential backoff
 *
 * Similar to waitForSession but uses exponential backoff instead of
 * fixed intervals. Useful for scenarios where the session might take
 * longer to establish.
 *
 * @param options - Configuration options
 * @returns Promise<boolean> - true if session available
 *
 * @example
 * ```typescript
 * const sessionReady = await waitForSessionWithBackoff({
 *   maxWait: 5000,
 *   initialInterval: 50,
 *   maxInterval: 500,
 * });
 * ```
 */
export async function waitForSessionWithBackoff(
  options: WaitForSessionOptions & {
    initialInterval?: number;
    maxInterval?: number;
    backoffFactor?: number;
  } = {}
): Promise<boolean> {
  const {
    maxWait = 1000,
    initialInterval = 50,
    maxInterval = 500,
    backoffFactor = 2,
    checkSession = defaultCheckSession,
  } = options;

  const startTime = Date.now();
  let attempts = 0;
  let currentInterval = initialInterval;

  logDebug('waitForSessionWithBackoff', 'Starting session polling with backoff', {
    maxWait,
    initialInterval,
    maxInterval,
    backoffFactor,
  });

  while (Date.now() - startTime < maxWait) {
    attempts++;

    try {
      const sessionAvailable = await checkSession();

      logDebug('waitForSessionWithBackoff', `Attempt ${attempts}`, {
        sessionAvailable,
        elapsed: Date.now() - startTime,
        currentInterval,
      });

      if (sessionAvailable) {
        logDebug('waitForSessionWithBackoff', 'Session available', {
          attempts,
          elapsed: Date.now() - startTime,
        });
        return true;
      }
    } catch (error) {
      logWarn('waitForSessionWithBackoff', 'Session check failed', {
        error: error instanceof Error ? error.message : String(error),
        attempts,
      });
    }

    // Wait with current interval
    await new Promise(resolve => setTimeout(resolve, currentInterval));

    // Increase interval for next attempt (exponential backoff)
    currentInterval = Math.min(currentInterval * backoffFactor, maxInterval);
  }

  // Timeout exceeded
  logWarn('waitForSessionWithBackoff', 'Timeout exceeded - session not available', {
    attempts,
    elapsed: Date.now() - startTime,
    maxWait,
  });

  return false;
}
