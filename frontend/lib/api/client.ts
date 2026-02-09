// API Client with automatic JWT token injection

import { APIErrorResponse, APIResponse } from "./types";
import { clearSession } from "@/lib/auth/utils";

export class APIClient {
  private baseURL: string;
  private getToken: () => string | null;

  constructor(baseURL: string, getToken: () => string | null) {
    this.baseURL = baseURL;
    this.getToken = getToken;
  }

  /**
   * Generic request method with automatic Authorization header injection
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const token = this.getToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      // Add Authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // CRITICAL: Allow cross-origin cookies
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData: APIErrorResponse = await response.json().catch(() => ({
          detail: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        }));

        // Handle 401 Unauthorized - session expired or invalid token
        if (response.status === 401) {
          // Clear session and redirect to signin page
          if (typeof window !== "undefined") {
            clearSession();

            // Delay redirect to allow clearSession to complete
            setTimeout(() => {
              window.location.href = "/signin?message=session_expired";
            }, 2000);
          }
          return {
            error: {
              detail: "Your session has expired. Please log in again.",
              status: 401,
            },
          };
        }

        // Handle 403 Forbidden - user doesn't have permission
        if (response.status === 403) {
          return {
            error: {
              detail: "You don't have permission to access this resource.",
              status: 403,
            },
          };
        }

        return {
          error: {
            detail: errorData.detail || `Request failed with status ${response.status}`,
            status: response.status,
          },
        };
      }

      // Handle successful responses
      // Check if response has content (204 No Content has no body)
      if (response.status === 204) {
        return { data: null as T };
      }

      const data: T = await response.json();
      return { data };
    } catch (error) {
      // Handle network errors or other exceptions
      return {
        error: {
          detail: error instanceof Error ? error.message : "Network error occurred",
          status: 0,
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: unknown): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body: unknown): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

/**
 * Create API client instance
 */
export function createAPIClient(getToken: () => string | null): APIClient {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return new APIClient(baseURL, getToken);
}
