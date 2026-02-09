/**
 * Debug logging utility for authentication operations
 *
 * Provides structured logging with environment-based toggling.
 * Debug logs are only shown in development mode.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Check if debug logging is enabled
 *
 * Debug logs are enabled when:
 * - NODE_ENV is 'development'
 * - Or DEBUG_AUTH environment variable is set to 'true'
 */
function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check process.env
    return process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true';
  }

  // Client-side: check localStorage or default to development
  try {
    const debugOverride = localStorage.getItem('DEBUG_AUTH');
    if (debugOverride !== null) {
      return debugOverride === 'true';
    }
  } catch {
    // localStorage not available (SSR or disabled)
  }

  return process.env.NODE_ENV === 'development';
}

/**
 * Format log message with context
 */
function formatMessage(component: string, message: string, context?: LogContext): string {
  const prefix = `[Auth:${component}]`;

  if (context && Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context)}`;
  }

  return `${prefix} ${message}`;
}

/**
 * Log debug message (development only)
 *
 * @param component - Component or module name (e.g., 'getSession', 'signin')
 * @param message - Log message
 * @param context - Optional context object with additional data
 */
export function logDebug(component: string, message: string, context?: LogContext): void {
  if (!isDebugEnabled()) {
    return;
  }

  console.debug(formatMessage(component, message, context));
}

/**
 * Log info message (always enabled)
 *
 * @param component - Component or module name
 * @param message - Log message
 * @param context - Optional context object
 */
export function logInfo(component: string, message: string, context?: LogContext): void {
  console.log(formatMessage(component, message, context));
}

/**
 * Log warning message (always enabled)
 *
 * @param component - Component or module name
 * @param message - Warning message
 * @param context - Optional context object
 */
export function logWarn(component: string, message: string, context?: LogContext): void {
  console.warn(formatMessage(component, message, context));
}

/**
 * Log error message (always enabled)
 *
 * @param component - Component or module name
 * @param message - Error message
 * @param error - Optional Error object or context
 */
export function logError(component: string, message: string, error?: Error | LogContext): void {
  const context = error instanceof Error
    ? { error: error.message, stack: error.stack }
    : error;

  console.error(formatMessage(component, message, context));
}

/**
 * Log authentication event with structured format
 *
 * @param event - Event name (e.g., 'signin', 'session_check', 'navigation')
 * @param details - Event details object
 */
export function logAuthEvent(event: string, details: LogContext): void {
  if (!isDebugEnabled()) {
    return;
  }

  const timestamp = new Date().toISOString();
  console.debug(`[Auth:${event}]`, JSON.stringify({ ...details, timestamp }));
}

/**
 * Enable debug logging at runtime (client-side only)
 *
 * Usage in browser console:
 * ```javascript
 * import { enableDebugLogging } from '@/lib/auth/logger';
 * enableDebugLogging();
 * ```
 */
export function enableDebugLogging(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('DEBUG_AUTH', 'true');
      console.log('[Auth:Logger] Debug logging enabled');
    } catch (e) {
      console.warn('[Auth:Logger] Cannot enable debug logging:', e);
    }
  }
}

/**
 * Disable debug logging at runtime (client-side only)
 */
export function disableDebugLogging(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('DEBUG_AUTH');
      console.log('[Auth:Logger] Debug logging disabled');
    } catch (e) {
      console.warn('[Auth:Logger] Cannot disable debug logging:', e);
    }
  }
}
