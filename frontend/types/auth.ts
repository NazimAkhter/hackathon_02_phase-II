export interface User {
  id: string; // UUID
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date | null;
}

export interface UserCreateInput {
  email: string;
  password: string; // Plaintext, will be hashed
}

export interface UserSignInInput {
  email: string;
  password: string; // Plaintext, will be verified against hash
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: string; // ISO 8601 format
  lastSignInAt: string | null; // ISO 8601 format
  // passwordHash intentionally excluded for security
}

export interface JWTPayload {
  userId: string; // UUID
  email: string;
  iat: number; // Unix timestamp (seconds)
  exp: number; // Unix timestamp (seconds)
}

export interface JWTToken {
  token: string; // Full JWT string (header.payload.signature)
  expiresAt: Date; // Human-readable expiration time
}

export interface AuthSession {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  expiresAt: Date | null;
}

export interface AuthContext {
  session: AuthSession;
  signIn: (email: string, password: string) => Promise<UserResponse>;
  signUp: (email: string, password: string) => Promise<UserResponse>;
  signOut: () => Promise<void>;
}
