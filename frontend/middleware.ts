import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * JWT Payload interface for token decoding
 */
interface JWTPayload {
  user_id: string;
  email: string;
  exp: number;
  iat: number;
}

/**
 * Decode JWT token and extract payload
 * WARNING: This does not verify the token signature!
 * Token verification happens on the backend.
 *
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
function decodeToken(token: string): JWTPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode base64 payload (middle part)
    const payload = parts[1];
    const decodedPayload = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    );

    // Extract user information from payload
    return {
      user_id: decodedPayload.userId || decodedPayload.user_id || decodedPayload.sub,
      email: decodedPayload.email,
      exp: decodedPayload.exp,
      iat: decodedPayload.iat,
    };
  } catch (error) {
    console.error("[Middleware] Failed to decode token:", error);
    return null;
  }
}

/**
 * Check if token is expired
 *
 * @param exp - Expiration timestamp in seconds
 * @returns true if expired, false otherwise
 */
function isTokenExpired(exp: number): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= exp;
}

/**
 * Middleware for authentication protection
 *
 * Enhanced version with:
 * - Session expiration validation
 * - Detailed error messages for different failure scenarios
 * - Proper handling of invalid/expired tokens
 * - ReturnUrl preservation for post-signin redirect
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Define protected routes
  const isProtectedRoute = pathname.startsWith("/dashboard");

  // Allow non-protected routes to pass through
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check if request is coming from signin/signup (allow immediate access)
  const referer = request.headers.get("referer");
  if (referer && (referer.includes("/signin") || referer.includes("/signup"))) {
    // Allow access - the dashboard page will validate the session
    return NextResponse.next();
  }

  // Get JWT token from cookies
  const token = request.cookies.get("better-auth.session.token")?.value;

  // No token found - user is not authenticated
  if (!token) {
    const signinUrl = new URL("/signin", request.url);

    // Encode returnUrl with pathname + search params
    const returnUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    signinUrl.searchParams.set("returnUrl", returnUrl);
    signinUrl.searchParams.set("error", "unauthorized");

    return NextResponse.redirect(signinUrl);
  }

  // Decode and validate token
  const payload = decodeToken(token);

  // Invalid token format
  if (!payload) {
    const signinUrl = new URL("/signin", request.url);

    const returnUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    signinUrl.searchParams.set("returnUrl", returnUrl);
    signinUrl.searchParams.set("error", "invalid_session");

    return NextResponse.redirect(signinUrl);
  }

  // Check if token is expired
  if (isTokenExpired(payload.exp)) {
    const signinUrl = new URL("/signin", request.url);

    const returnUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    signinUrl.searchParams.set("returnUrl", returnUrl);
    signinUrl.searchParams.set("error", "session_expired");

    return NextResponse.redirect(signinUrl);
  }

  // Token is valid - allow access
  return NextResponse.next();
}

/**
 * Matcher configuration
 * Exclude static files, API routes, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public assets)
     * - api routes (API endpoints)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
