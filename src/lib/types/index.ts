export type Role = "owner" | "admin" | "viewer";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface TodoList {
  id: string;
  title: string;
  ownerId: string;
  members: Record<string, Role>;
  createdAt: number;
  updatedAt: number;
  order?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  order?: number;
}
