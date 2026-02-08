"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types/task";
import { CreateTaskRequest, TaskResponse } from "@/lib/api/types";
import { createTaskAPI } from "@/lib/api/tasks";
import { useAuth } from "./useAuth";

interface UseTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  pendingOps: Set<string>;
  fetchTasks: () => Promise<void>;
  createTask: (title: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string, completed: boolean) => Promise<void>;
  updateTask: (taskId: string, title: string, completed: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

/**
 * Custom hook for managing task state and API operations
 * Handles tasks CRUD operations with loading and error states
 */
export function useTasks(): UseTasksResult {
  const { apiClient, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());

  /**
   * Fetch all tasks for the authenticated user
   */
  const fetchTasks = useCallback(async () => {
    if (!apiClient || !user) {
      setError("User not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const taskAPI = createTaskAPI(apiClient, user.id);
      const response = await taskAPI.listTasks();

      if (response.error) {
        setError(response.error.detail);
        setTasks([]);
      } else if (response.data) {
        setTasks(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, user]);

  /**
   * Create a new task with optimistic update
   * Immediately shows the task in UI, then syncs with API
   * Rolls back on error
   */
  const createTask = useCallback(
    async (title: string) => {
      if (!apiClient || !user) {
        setError("User not authenticated");
        return;
      }

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        title,
        completed: false,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        setError(null);
        setPendingOps((prev) => new Set(prev).add(tempId));

        // Optimistic update: add task immediately
        setTasks((prevTasks) => [optimisticTask, ...prevTasks]);

        const taskAPI = createTaskAPI(apiClient, user.id);
        const requestData: CreateTaskRequest = { title };
        const response = await taskAPI.createTask(requestData);

        if (response.error) {
          setError(response.error.detail);
          // Rollback: remove optimistic task
          setTasks((prevTasks) => prevTasks.filter((task) => task.id !== tempId));
          throw new Error(response.error.detail);
        } else if (response.data) {
          // Replace temp task with real task from server
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === tempId ? (response.data as TaskResponse) : task
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");
        throw err;
      } finally {
        setPendingOps((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    },
    [apiClient, user]
  );

  /**
   * Toggle task completion status with optimistic update
   * Immediately updates UI, tracks pending state, rolls back on error
   */
  const toggleTaskCompletion = useCallback(
    async (taskId: string, completed: boolean) => {
      if (!apiClient || !user) {
        setError("User not authenticated");
        return;
      }

      try {
        setError(null);
        setPendingOps((prev) => new Set(prev).add(taskId));

        // Optimistic update
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, completed } : task
          )
        );

        const taskAPI = createTaskAPI(apiClient, user.id);
        const response = await taskAPI.toggleTaskCompletion(taskId, completed);

        if (response.error) {
          setError(response.error.detail);
          // Revert optimistic update on error
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId ? { ...task, completed: !completed } : task
            )
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to toggle task completion"
        );
        // Revert optimistic update on error
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, completed: !completed } : task
          )
        );
      } finally {
        setPendingOps((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [apiClient, user]
  );

  /**
   * Update a task (full update with title and status)
   * Updates the task in the local state on success
   */
  const updateTask = useCallback(
    async (taskId: string, title: string, completed: boolean) => {
      if (!apiClient || !user) {
        setError("User not authenticated");
        return;
      }

      try {
        setError(null);

        const taskAPI = createTaskAPI(apiClient, user.id);
        const response = await taskAPI.updateTask(taskId, { title, completed });

        if (response.error) {
          setError(response.error.detail);
          throw new Error(response.error.detail);
        } else if (response.data) {
          // Update task in local state
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId ? response.data as Task : task
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update task");
        throw err;
      }
    },
    [apiClient, user]
  );

  /**
   * Delete a task with optimistic update
   * Immediately removes from UI, then syncs with API
   * Restores on error
   */
  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!apiClient || !user) {
        setError("User not authenticated");
        return;
      }

      // Store task for potential rollback
      let deletedTask: Task | undefined;

      try {
        setError(null);
        setPendingOps((prev) => new Set(prev).add(taskId));

        // Store the task before removing it
        setTasks((prevTasks) => {
          deletedTask = prevTasks.find((task) => task.id === taskId);
          return prevTasks.filter((task) => task.id !== taskId);
        });

        const taskAPI = createTaskAPI(apiClient, user.id);
        const response = await taskAPI.deleteTask(taskId);

        if (response.error) {
          setError(response.error.detail);
          // Restore task on error
          if (deletedTask) {
            setTasks((prevTasks) => [deletedTask!, ...prevTasks]);
          }
          throw new Error(response.error.detail);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete task");
        throw err;
      } finally {
        setPendingOps((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [apiClient, user]
  );

  return {
    tasks,
    isLoading,
    error,
    pendingOps,
    fetchTasks,
    createTask,
    toggleTaskCompletion,
    updateTask,
    deleteTask,
  };
}
