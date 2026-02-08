// Task entity type matching backend API schema
export interface Task {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

// Type for task list response from API
export interface TaskListResponse {
  tasks: Task[];
}
