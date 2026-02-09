/**
 * Database client for server-side operations
 *
 * This module provides a PostgreSQL connection for Next.js API routes
 * to interact with the Neon database.
 */

import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export interface DBUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new user in the database
 */
export async function createUser(
  id: string,
  email: string,
  passwordHash: string
): Promise<DBUser> {
  const query = `
    INSERT INTO users (id, email, password_hash, created_at, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const result = await pool.query(query, [id, email, passwordHash]);
  return result.rows[0];
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<DBUser | null> {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<DBUser | null> {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export { pool };
