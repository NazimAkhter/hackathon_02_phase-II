"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface TaskCreateFormProps {
  onCreateTask: (title: string) => Promise<void>;
}

interface FormData {
  title: string;
}

/**
 * TaskCreateForm component with React Hook Form validation
 * Validates: title required, 1-500 characters
 * Clears input after successful submission
 */
export function TaskCreateForm({ onCreateTask }: TaskCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    mode: "onSubmit",
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateTask(data.title);
      reset(); // Clear form after successful submission
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create task. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            {...register("title", {
              required: "Task title is required",
              minLength: {
                value: 1,
                message: "Task title must be at least 1 character",
              },
              maxLength: {
                value: 500,
                message: "Task title must not exceed 500 characters",
              },
            })}
            type="text"
            placeholder="Enter a new task..."
            error={errors.title?.message}
            fullWidth
            disabled={isSubmitting}
            aria-label="New task title"
          />
        </div>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="sm:self-start"
        >
          Add Task
        </Button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-700 underline hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}
    </form>
  );
}
