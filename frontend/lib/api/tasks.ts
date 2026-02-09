// Task API methods using APIClient

import { Task } from "@/types/task";
import {
  CreateTaskRequest,
  PatchTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  APIResponse,
} from "./types";
import { APIClient } from "./client";

export class TaskAPI {
  private client: APIClient;
  private userId: string;

  constructor(client: APIClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  /**
   * List all tasks for the authenticated user
   * GET /api/{user_id}/tasks
   */
  async listTasks(): Promise<APIResponse<Task[]>> {
    const response = await this.client.get<Task[]>(`/api/${this.userId}/tasks`);
    return response;
  }

  /**
   * Create a new task
   * POST /api/{user_id}/tasks
   */
  async createTask(data: CreateTaskRequest): Promise<APIResponse<TaskResponse>> {
    return this.client.post<TaskResponse>(`/api/${this.userId}/tasks`, data);
  }

  /**
   * Toggle task completion status
   * PATCH /api/{user_id}/tasks/{task_id}
   */
  async toggleTaskCompletion(
    taskId: string,
    completed: boolean
  ): Promise<APIResponse<TaskResponse>> {
    const data: PatchTaskRequest = { completed };
    return this.client.patch<TaskResponse>(
      `/api/${this.userId}/tasks/${taskId}`,
      data
    );
  }

  /**
   * Update task (full update with title and status)
   * PUT /api/{user_id}/tasks/{task_id}
   */
  async updateTask(
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<APIResponse<TaskResponse>> {
    return this.client.put<TaskResponse>(
      `/api/${this.userId}/tasks/${taskId}`,
      data
    );
  }

  /**
   * Delete a task
   * DELETE /api/{user_id}/tasks/{task_id}
   */
  async deleteTask(taskId: string): Promise<APIResponse<{ message: string }>> {
    return this.client.delete<{ message: string }>(
      `/api/${this.userId}/tasks/${taskId}`
    );
  }

  /**
   * Get a single task by ID
   * GET /api/{user_id}/tasks/{task_id}
   */
  async getTask(taskId: string): Promise<APIResponse<TaskResponse>> {
    return this.client.get<TaskResponse>(`/api/${this.userId}/tasks/${taskId}`);
  }
}

/**
 * Create TaskAPI instance
 */
export function createTaskAPI(client: APIClient, userId: string): TaskAPI {
  return new TaskAPI(client, userId);
}
