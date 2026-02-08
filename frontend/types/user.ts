// User entity type from Better Auth
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

// JWT token payload structure
export interface JWTPayload {
  user_id: string;
  email: string;
  exp: number; // Expiration timestamp (Unix epoch)
  iat: number; // Issued at timestamp (Unix epoch)
}

// User session type
export interface UserSession {
  user: User;
  token: string;
  expiresAt: number;
}
