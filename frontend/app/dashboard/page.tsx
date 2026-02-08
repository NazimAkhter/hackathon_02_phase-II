"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/useTasks";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskCreateForm } from "@/components/tasks/TaskCreateForm";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth/utils";
import { validateSession } from "@/lib/auth/validation";
import { clearSession } from "@/lib/auth/utils";
import { logDebug, logInfo, logWarn } from "@/lib/auth/logger";

/**
 * Dashboard page - Main view for authenticated users
 * Displays task list with create, view, and toggle completion functionality
 *
 * CRITICAL: Validates session on mount to prevent "session expired" errors
 */
export default function DashboardPage() {
  const router = useRouter();
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [sessionExpiredWarning, setSessionExpiredWarning] = useState(false);

  const {
    tasks,
    isLoading,
    error,
    pendingOps,
    fetchTasks,
    createTask,
    toggleTaskCompletion,
    updateTask,
    deleteTask,
  } = useTasks();

  // Validate session on component mount (CRITICAL FIX)
  useEffect(() => {
    const validateAndLoadData = async () => {
      logDebug('Dashboard', 'Starting session validation on mount');

      try {
        // 1. Attempt to get session (with built-in retry)
        const session = await getSession('dashboard-page-mount');

        // 2. Handle missing session
        if (!session) {
          logWarn('Dashboard', 'No session found after retry - redirecting to signin');
          router.push('/signin?message=session_expired');
          return;
        }

        logDebug('Dashboard', 'Session retrieved', {
          email: session.user.email,
          expiresAt: session.expiresAt,
        });

        // 3. Validate session not expired
        if (!validateSession(session)) {
          logWarn('Dashboard', 'Session expired - clearing and redirecting', {
            expiresAt: session.expiresAt,
            currentTime: Math.floor(Date.now() / 1000),
          });
          clearSession();
          router.push('/signin?message=session_expired');
          return;
        }

        // 4. Session valid - mark as validated and proceed
        logInfo('Dashboard', 'Session validated successfully', { email: session.user.email });
        setSessionValid(true);
        setIsValidatingSession(false);

      } catch (error) {
        logWarn('Dashboard', 'Session validation error', {
          error: error instanceof Error ? error.message : String(error),
        });
        router.push('/signin?message=session_expired');
      }
    };

    validateAndLoadData();
  }, [router]);

  // Fetch tasks only after session validation passes
  useEffect(() => {
    if (sessionValid) {
      logDebug('Dashboard', 'Session valid - fetching tasks');
      fetchTasks();
    }
  }, [sessionValid, fetchTasks]);

  // Periodic session validation (check every 60 seconds during active use)
  useEffect(() => {
    if (!sessionValid) return;

    const checkSessionPeriodically = async () => {
      logDebug('Dashboard', 'Periodic session check');

      try {
        const session = await getSession('dashboard-periodic-check');

        if (!session || !validateSession(session)) {
          logWarn('Dashboard', 'Session expired during active use');
          setSessionExpiredWarning(true);

          // Give user 3 seconds to see the warning before redirect
          setTimeout(() => {
            clearSession();
            router.push('/signin?message=session_expired');
          }, 3000);
        }
      } catch (error) {
        logWarn('Dashboard', 'Periodic session check failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Check every 60 seconds
    const intervalId = setInterval(checkSessionPeriodically, 60000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [sessionValid, router]);

  // Handle task creation
  const handleCreateTask = async (title: string) => {
    await createTask(title);
  };

  // Handle task completion toggle
  const handleToggleCompletion = async (taskId: string, completed: boolean) => {
    await toggleTaskCompletion(taskId, completed);
  };

  // Handle task update (edit)
  const handleUpdateTask = async (taskId: string, title: string, completed: boolean) => {
    await updateTask(taskId, title, completed);
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  // Handle retry for failed task fetch
  const handleRetry = () => {
    fetchTasks();
  };

  // Show loading state while validating session
  if (isValidatingSession) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-600 mt-1">Loading your workspace...</p>
          </div>
          <TaskSkeleton count={5} />
        </div>
      </div>
    );
  }

  // Only render full dashboard if session is valid
  if (!sessionValid) {
    return null; // Redirecting to signin
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">Organize your daily tasks efficiently</p>
        </div>

        {/* Session Expired Warning */}
        {sessionExpiredWarning && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800">
                  Session Expired
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Your session has expired. You will be redirected to the signin page in a moment...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task Creation Form */}
        <div className="mb-8">
          <TaskCreateForm onCreateTask={handleCreateTask} />
        </div>

        {/* Loading State - Show Skeleton */}
        {isLoading && !error && tasks.length === 0 && (
          <TaskSkeleton count={5} />
        )}

      {/* Error State with Retry */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="w-12 h-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Failed to Load Tasks
              </h3>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Button onClick={handleRetry} variant="danger">
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

        {/* Task List - Show when not loading or when we have tasks */}
        {!isLoading && !error && (
          <TaskList
            tasks={tasks}
            onToggleCompletion={handleToggleCompletion}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            pendingOps={pendingOps}
          />
        )}

        {/* Show task list even during background refresh if we have tasks */}
        {isLoading && tasks.length > 0 && (
          <TaskList
            tasks={tasks}
            onToggleCompletion={handleToggleCompletion}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            pendingOps={pendingOps}
          />
        )}
      </div>
    </div>
  );
}
