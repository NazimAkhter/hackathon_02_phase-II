// Form data types for authentication and task management

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Signup form data
export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

// Task creation form data
export interface TaskCreateFormData {
  title: string;
}

// Task editing form data
export interface TaskEditFormData {
  title: string;
}

// Task deletion confirmation
export interface TaskDeleteConfirmData {
  taskId: string;
  taskTitle: string;
}
