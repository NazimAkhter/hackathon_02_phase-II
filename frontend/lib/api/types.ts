// API request and response types

import { Task } from "@/types/task";

// API Error Response
export interface APIErrorResponse {
  detail: string;
  status?: number;
}

// Create Task Request
export interface CreateTaskRequest {
  title: string;
}

// Update Task Request (full update)
export interface UpdateTaskRequest {
  title: string;
  completed: boolean;
}

// Patch Task Request (toggle completion only)
export interface PatchTaskRequest {
  completed: boolean;
}

// API Response wrapper
export interface APIResponse<T> {
  data?: T;
  error?: APIErrorResponse;
}

// Task response from API (single task)
export type TaskResponse = Task;

// Task list response from API
export interface TaskListResponse {
  tasks: Task[];
}
