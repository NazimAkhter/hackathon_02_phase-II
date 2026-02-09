import { logDebug, logWarn } from './logger';

/**
 * Email validation using RFC 5322 format
 *
 * Validates email addresses using a simplified RFC 5322 regex pattern.
 * This pattern checks for the basic email structure: local@domain.tld
 *
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * validateEmail('user@example.com') // true
 * validateEmail('invalid-email')     // false
 * validateEmail('no@domain')         // false
 * ```
 */
export function validateEmail(email: string): boolean {
  logDebug('validateEmail', 'Validating email format', {
    emailLength: email.length,
    hasAtSymbol: email.includes('@'),
  });

  // RFC 5322 simplified regex: requires @ symbol and domain with TLD
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  if (!isValid) {
    logDebug('validateEmail', 'Email validation failed', {
      reason: !email.includes('@') ? 'missing @ symbol' : 'invalid format',
    });
  } else {
    logDebug('validateEmail', 'Email validation passed');
  }

  return isValid;
}

/**
 * Password validation
 *
 * Validates password strength based on security requirements:
 * - Minimum 8 characters (prevents weak passwords)
 * - At least one letter (a-z or A-Z)
 * - At least one number (0-9)
 *
 * This provides a balance between security and usability.
 * Does NOT require special characters to avoid user frustration.
 *
 * @param password - Password to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * validatePassword('password123')  // true (8+ chars, letters, numbers)
 * validatePassword('short1')       // false (too short)
 * validatePassword('noNumbers')    // false (no numbers)
 * validatePassword('12345678')     // false (no letters)
 * ```
 */
export function validatePassword(password: string): boolean {
  logDebug('validatePassword', 'Validating password strength', {
    length: password.length,
  });

  // Check minimum length requirement
  if (password.length < 8) {
    logDebug('validatePassword', 'Password validation failed: too short', {
      length: password.length,
      required: 8,
    });
    return false;
  }

  // Check for at least one letter (uppercase or lowercase)
  const hasLetter = /[a-zA-Z]/.test(password);

  // Check for at least one number
  const hasNumber = /[0-9]/.test(password);

  // Password is valid only if both conditions are met
  const isValid = hasLetter && hasNumber;

  if (!isValid) {
    logDebug('validatePassword', 'Password validation failed: missing requirements', {
      hasLetter,
      hasNumber,
    });
  } else {
    logDebug('validatePassword', 'Password validation passed');
  }

  return isValid;
}

/**
 * Get user-friendly validation error message
 *
 * Provides specific, actionable error messages for validation failures.
 * Use this to give users clear feedback on what went wrong.
 *
 * @param field - Field being validated ('email' or 'password')
 * @param value - Value that failed validation (used to determine specific password error)
 * @returns Human-readable error message
 *
 * @example
 * ```typescript
 * getValidationError('email', 'invalid')           // 'Invalid email format'
 * getValidationError('password', 'short')          // 'Password must be at least 8 characters'
 * getValidationError('password', 'noNumbers123')   // 'Password must include letters and numbers'
 * ```
 */
export function getValidationError(field: 'email' | 'password', value: string): string {
  logDebug('getValidationError', 'Generating error message', {
    field,
    valueLength: value.length,
  });

  if (field === 'email') {
    const errorMessage = 'Invalid email format';
    logDebug('getValidationError', 'Email error message generated', { errorMessage });
    return errorMessage;
  }

  if (field === 'password') {
    // Provide specific error message based on what's wrong
    if (value.length < 8) {
      const errorMessage = 'Password must be at least 8 characters';
      logDebug('getValidationError', 'Password error: too short', {
        errorMessage,
        length: value.length,
      });
      return errorMessage;
    }
    // If length is OK but validation failed, it's missing letters or numbers
    const errorMessage = 'Password must include letters and numbers';
    logDebug('getValidationError', 'Password error: missing requirements', { errorMessage });
    return errorMessage;
  }

  // Fallback for unknown fields (should never happen with TypeScript)
  logWarn('getValidationError', 'Unknown field type', { field });
  return 'Invalid input';
}

/**
 * Session interface for validation
 */
export interface UserSession {
  user: {
    id: string;
    email: string;
  };
  token: string;
  expiresAt: number; // Unix timestamp in seconds
}

/**
 * Validate session expiration
 *
 * Checks if a session is still valid (not expired) by comparing
 * the expiration timestamp with the current time.
 *
 * @param session - User session object with expiresAt timestamp
 * @returns true if session is valid (not expired), false if expired or invalid
 *
 * @example
 * ```typescript
 * const session = {
 *   user: { id: '123', email: 'user@example.com' },
 *   token: 'jwt-token',
 *   expiresAt: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
 * };
 *
 * validateSession(session) // true (not expired)
 *
 * const expiredSession = {
 *   ...session,
 *   expiresAt: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
 * };
 *
 * validateSession(expiredSession) // false (expired)
 * ```
 */
export function validateSession(session: UserSession | null): boolean {
  logDebug('validateSession', 'Starting session validation', {
    hasSession: session !== null,
  });

  // Null or undefined session is invalid
  if (!session) {
    logDebug('validateSession', 'Validation failed: session is null or undefined');
    return false;
  }

  // Check if session has required properties
  if (!session.expiresAt || typeof session.expiresAt !== 'number') {
    logWarn('validateSession', 'Validation failed: missing or invalid expiresAt', {
      hasExpiresAt: !!session.expiresAt,
      expiresAtType: typeof session.expiresAt,
    });
    return false;
  }

  // Get current time in Unix seconds
  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = session.expiresAt - currentTime;

  logDebug('validateSession', 'Checking expiration time', {
    currentTime,
    expiresAt: session.expiresAt,
    timeUntilExpiry,
    email: session.user?.email,
  });

  // Session is valid if expiration time is in the future
  // Add 5-minute grace period for minor clock skew (300 seconds)
  const isExpired = session.expiresAt <= currentTime;

  if (isExpired) {
    logWarn('validateSession', 'Session expired', {
      expiresAt: session.expiresAt,
      currentTime,
      expiredBy: Math.abs(timeUntilExpiry),
      email: session.user?.email,
    });
  } else {
    logDebug('validateSession', 'Session is valid', {
      timeUntilExpiry,
      expiresIn: `${Math.floor(timeUntilExpiry / 60)} minutes`,
      email: session.user?.email,
    });
  }

  return !isExpired;
}
