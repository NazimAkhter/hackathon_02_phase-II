"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";

interface TaskEditFormProps {
  initialTitle: string;
  onSave: (title: string) => Promise<void>;
  onCancel: () => void;
}

interface EditFormData {
  title: string;
}

/**
 * TaskEditForm component for inline task editing
 * Provides input field with Save and Cancel buttons
 * Validates title length (1-500 characters)
 */
export function TaskEditForm({ initialTitle, onSave, onCancel }: TaskEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormData>({
    defaultValues: {
      title: initialTitle,
    },
  });

  const onSubmit = async (data: EditFormData) => {
    if (!data.title.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(data.title.trim());
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1">
      <div className="space-y-2">
        <input
          type="text"
          {...register("title", {
            required: "Title is required",
            minLength: {
              value: 1,
              message: "Title must be at least 1 character",
            },
            maxLength: {
              value: 500,
              message: "Title must not exceed 500 characters",
            },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter task title"
          autoFocus
          disabled={isSaving}
        />
        {errors.title && (
          <p className="text-sm text-red-600" role="alert">
            {errors.title.message}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
