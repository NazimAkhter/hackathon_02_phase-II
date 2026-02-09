interface RateLimitRecord {
  count: number;
  resetAt: number; // Unix timestamp in milliseconds
}

// In-memory store for rate limiting
// For production with multiple instances, consider Redis
const attemptStore = new Map<string, RateLimitRecord>();

/**
 * Check if request should be rate limited
 * @param email - Email address to check rate limit for
 * @param maxAttempts - Maximum attempts allowed (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  email: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const record = attemptStore.get(email);

  // No record or expired record - allow and create new record
  if (!record || now > record.resetAt) {
    attemptStore.set(email, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true; // Allow
  }

  // Record exists and not expired - check count
  if (record.count >= maxAttempts) {
    return false; // Block - rate limit exceeded
  }

  // Increment attempt count
  record.count++;
  attemptStore.set(email, record);
  return true; // Allow
}

/**
 * Reset rate limit for an email (e.g., after successful login)
 * @param email - Email address to reset
 */
export function resetRateLimit(email: string): void {
  attemptStore.delete(email);
}

/**
 * Clean up expired entries from the store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [email, record] of attemptStore.entries()) {
    if (now > record.resetAt) {
      attemptStore.delete(email);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
