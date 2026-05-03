export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface ProjectMember {
  user: User;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  identifier: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  identifier: string;
  color: string;
  status: 'active' | 'paused' | 'completed';
  members: ProjectMember[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project: ProjectSummary;
  assignee: User | null;
  created_by: User;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'none' | 'urgent' | 'high' | 'medium' | 'low';
  due_date: string | null;
  task_number: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  refresh: string;
  user: User;
}
