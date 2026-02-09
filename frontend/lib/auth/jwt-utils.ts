import jwt from 'jsonwebtoken';
import { JWTPayload } from '@/types/auth';
import { env } from '../env';

/**
 * Generate a JWT token
 * @param payload - Token payload containing userId and email
 * @returns Signed JWT token string
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const token = jwt.sign(
    payload,
    env.BETTER_AUTH_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '7d', // 7 days = 604800 seconds
    }
  );
  return token;
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyJWT(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.BETTER_AUTH_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token signature');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decode a JWT token without verification (for debugging/testing only)
 * @param token - JWT token string
 * @returns Decoded payload
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * FastAPI Integration Example
 *
 * For backend integration with FastAPI, use the following Python code:
 *
 * ```python
 * import jwt
 * import os
 * from fastapi import HTTPException, Cookie
 *
 * BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")
 *
 * def verify_jwt_token(token: str) -> dict:
 *     \"\"\"
 *     Verify JWT token from Better Auth frontend
 *     Returns payload containing userId and email
 *     Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError
 *     \"\"\"
 *     try:
 *         payload = jwt.decode(
 *             token,
 *             BETTER_AUTH_SECRET,
 *             algorithms=["HS256"]
 *         )
 *         return {
 *             "user_id": payload["userId"],
 *             "email": payload["email"]
 *         }
 *     except jwt.ExpiredSignatureError:
 *         raise HTTPException(status_code=401, detail="Token expired")
 *     except jwt.InvalidTokenError:
 *         raise HTTPException(status_code=401, detail="Invalid token signature")
 *
 * async def get_current_user(
 *     better_auth_session_token: str = Cookie(None, alias="better-auth.session.token")
 * ) -> dict:
 *     if not better_auth_session_token:
 *         raise HTTPException(status_code=401, detail="Missing authentication token")
 *
 *     return verify_jwt_token(better_auth_session_token)
 * ```
 */
