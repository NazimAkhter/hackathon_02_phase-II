"use client";

import React, { useState } from "react";
import { Task } from "@/types/task";
import { TaskEditForm } from "./TaskEditForm";
import { TaskDeleteConfirm } from "./TaskDeleteConfirm";

interface TaskItemProps {
  task: Task;
  onToggleCompletion: (taskId: string, completed: boolean) => void;
  onUpdate: (taskId: string, title: string, completed: boolean) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  isPending?: boolean;
}

/**
 * TaskItem component displays a single task with completion checkbox, edit, and delete functionality
 * Shows visual distinction for completed tasks (strikethrough + reduced opacity)
 * Supports inline editing and delete confirmation
 */
export function TaskItem({ task, onToggleCompletion, onUpdate, onDelete, isPending = false }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggleCompletion(task.id, e.target.checked);
  };

  const handleSaveEdit = async (newTitle: string) => {
    try {
      setError(null);
      await onUpdate(task.id, newTitle, task.completed);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onDelete(task.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-white border border-blue-300 rounded-lg shadow-sm">
        <TaskEditForm
          initialTitle={task.title}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
        {error && (
          <p className="text-sm text-red-600 mt-2" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg min-h-[68px] transition-all duration-250 hover:shadow-lg animate-fade-in ${isPending ? "opacity-60" : "opacity-100"}`}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleCheckboxChange}
          disabled={isPending}
          className="h-5 w-5 min-h-[44px] min-w-[44px] rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-base ${
                task.completed
                  ? "line-through text-gray-400"
                  : "text-gray-900"
              }`}
            >
              {task.title}
            </p>
            {isPending && (
              <div
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-t-transparent"
                role="status"
                aria-label="Saving changes"
              >
                <span className="sr-only">Saving...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {task.completed && (
              <span className="inline-flex items-center">
                <svg
                  className="w-3 h-3 mr-1 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Completed
              </span>
            )}
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            disabled={isPending}
            className="px-3 py-1 min-h-[44px] min-w-[44px] text-sm text-blue-600 hover:bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Edit task: ${task.title}`}
          >
            Edit
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isPending}
            className="px-3 py-1 min-h-[44px] min-w-[44px] text-sm text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Delete task: ${task.title}`}
          >
            Delete
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <TaskDeleteConfirm
          taskTitle={task.title}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
}
