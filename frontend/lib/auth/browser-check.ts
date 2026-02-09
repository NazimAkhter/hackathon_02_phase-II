/**
 * Browser compatibility check for cookie support
 *
 * Verifies that the browser environment supports cookies and
 * can store authentication session data.
 */

import { logWarn, logDebug } from './logger';

export interface BrowserCompatibility {
  cookiesEnabled: boolean;
  localStorageAvailable: boolean;
  isSecureContext: boolean;
  warnings: string[];
}

/**
 * Check if cookies are enabled in the browser
 *
 * @returns true if cookies are enabled and functional
 */
function checkCookiesEnabled(): boolean {
  logDebug('checkCookiesEnabled', 'Starting cookie support check');

  // Server-side rendering: assume cookies are available
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    logDebug('checkCookiesEnabled', 'Server-side context - assuming cookies available');
    return true;
  }

  try {
    // Test cookie write and read
    const testCookie = '_cookie_test';
    document.cookie = `${testCookie}=1; path=/; SameSite=Lax`;

    const cookieExists = document.cookie.includes(testCookie);

    // Clean up test cookie
    if (cookieExists) {
      document.cookie = `${testCookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    logDebug('checkCookiesEnabled', 'Cookie check completed', { cookieExists });
    return cookieExists;
  } catch (e) {
    logWarn('checkCookiesEnabled', 'Cookie test failed', { error: e });
    return false;
  }
}

/**
 * Check if localStorage is available
 *
 * @returns true if localStorage can be used
 */
function checkLocalStorageAvailable(): boolean {
  logDebug('checkLocalStorageAvailable', 'Starting localStorage availability check');

  if (typeof window === 'undefined') {
    logDebug('checkLocalStorageAvailable', 'Server-side context - localStorage not available');
    return false;
  }

  try {
    const testKey = '_ls_test';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    logDebug('checkLocalStorageAvailable', 'localStorage is available');
    return true;
  } catch (e) {
    logDebug('checkLocalStorageAvailable', 'localStorage is not available', {
      error: e instanceof Error ? e.message : String(e),
    });
    return false;
  }
}

/**
 * Check if the context is secure (HTTPS or localhost)
 *
 * @returns true if running on HTTPS or localhost
 */
function checkSecureContext(): boolean {
  logDebug('checkSecureContext', 'Starting secure context check');

  if (typeof window === 'undefined') {
    logDebug('checkSecureContext', 'Server-side context - assuming secure');
    return true; // Server-side, assume secure
  }

  // Check if secure context (HTTPS or localhost)
  if (window.isSecureContext !== undefined) {
    logDebug('checkSecureContext', 'Using window.isSecureContext API', {
      isSecure: window.isSecureContext,
    });
    return window.isSecureContext;
  }

  // Fallback: check protocol and hostname
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  const isSecure = (
    protocol === 'https:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );

  logDebug('checkSecureContext', 'Secure context check completed (fallback method)', {
    protocol,
    hostname,
    isSecure,
  });

  return isSecure;
}

/**
 * Perform comprehensive browser compatibility check
 *
 * Checks:
 * - Cookie support (required for authentication)
 * - LocalStorage availability (optional, for debug settings)
 * - Secure context (HTTPS or localhost)
 *
 * @returns BrowserCompatibility object with results and warnings
 */
export function checkBrowserCompatibility(): BrowserCompatibility {
  logDebug('checkBrowserCompatibility', 'Starting comprehensive browser compatibility check');

  const cookiesEnabled = checkCookiesEnabled();
  const localStorageAvailable = checkLocalStorageAvailable();
  const isSecureContext = checkSecureContext();

  const warnings: string[] = [];

  if (!cookiesEnabled) {
    warnings.push('Cookies are disabled. Authentication will not work.');
  }

  if (!localStorageAvailable) {
    warnings.push('LocalStorage is unavailable. Debug logging settings will not persist.');
  }

  if (!isSecureContext && typeof window !== 'undefined') {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      warnings.push('Not running in secure context (HTTPS). Secure cookies may not work.');
    } else {
      logDebug('browser-check', 'Running in insecure context (HTTP) - acceptable for development');
    }
  }

  // Log results
  if (warnings.length > 0) {
    warnings.forEach(warning => {
      logWarn('browser-check', warning);
    });
  } else {
    logDebug('browser-check', 'All compatibility checks passed', {
      cookiesEnabled,
      localStorageAvailable,
      isSecureContext,
    });
  }

  return {
    cookiesEnabled,
    localStorageAvailable,
    isSecureContext,
    warnings,
  };
}

/**
 * Check if authentication is supported in current browser
 *
 * This is a simplified check that only verifies the critical requirement:
 * cookies must be enabled.
 *
 * @returns true if authentication can work (cookies enabled)
 */
export function isAuthSupported(): boolean {
  logDebug('isAuthSupported', 'Checking if authentication is supported');

  const supported = checkCookiesEnabled();

  logDebug('isAuthSupported', 'Authentication support check completed', {
    supported,
  });

  return supported;
}

/**
 * Get user-friendly error message for unsupported browser
 *
 * @returns Error message string to display to users
 */
export function getUnsupportedBrowserMessage(): string {
  logDebug('getUnsupportedBrowserMessage', 'Generating unsupported browser message');

  const compat = checkBrowserCompatibility();

  if (!compat.cookiesEnabled) {
    const message = 'Your browser has cookies disabled. Please enable cookies to sign in.';
    logDebug('getUnsupportedBrowserMessage', 'Message generated: cookies disabled', { message });
    return message;
  }

  if (!compat.isSecureContext && process.env.NODE_ENV === 'production') {
    const message = 'This site requires a secure connection (HTTPS) for authentication.';
    logDebug('getUnsupportedBrowserMessage', 'Message generated: insecure context', { message });
    return message;
  }

  const message = 'Your browser configuration is preventing authentication. Please check your privacy settings.';
  logDebug('getUnsupportedBrowserMessage', 'Message generated: generic error', { message });
  return message;
}
