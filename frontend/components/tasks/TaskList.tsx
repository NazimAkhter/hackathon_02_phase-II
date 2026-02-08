"use client";

import React from "react";
import { Task } from "@/types/task";
import { TaskItem } from "./TaskItem";
import { EmptyState } from "../layout/EmptyState";

interface TaskListProps {
  tasks: Task[];
  onToggleCompletion: (taskId: string, completed: boolean) => void;
  onUpdate: (taskId: string, title: string, completed: boolean) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  pendingOps?: Set<string>;
}

/**
 * TaskList component displays a list of tasks
 * Shows EmptyState when tasks array is empty
 * Passes update and delete handlers to TaskItem components
 */
export function TaskList({ tasks, onToggleCompletion, onUpdate, onDelete, pendingOps = new Set() }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        message="No tasks yet. Add your first task!"
        icon={
          <svg
            className="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleCompletion={onToggleCompletion}
          onUpdate={onUpdate}
          onDelete={onDelete}
          isPending={pendingOps.has(task.id)}
        />
      ))}
    </div>
  );
}
