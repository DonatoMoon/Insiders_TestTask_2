"use client";

import { useEffect, useState } from "react";
import type { FirestoreError } from "firebase/firestore";
import { subscribeToTasks } from "@/lib/firestore/tasks";
import type { Task } from "@/lib/types";

// Stable empty reference so consumers don't see a new array every render.
const NO_TASKS: Task[] = [];

// Module-level cache — survives component unmount/remount (page navigations).
// The real-time subscription below keeps it up-to-date, so re-visiting a list
// shows stale-while-revalidate data instead of a loading flash.
const tasksCache = new Map<string, Task[]>();

interface TasksSnapshot {
  listId: string;
  tasks: Task[];
  error: FirestoreError | null;
}

export function useTasks(listId: string) {
  // The snapshot carries the listId it belongs to, so switching lists reads as
  // "loading" without a setState call in the effect body.
  // Initialise from cache immediately — no loading flash when revisiting a list.
  const [snapshot, setSnapshot] = useState<TasksSnapshot | null>(() => {
    const cached = tasksCache.get(listId);
    return cached ? { listId, tasks: cached, error: null } : null;
  });

  useEffect(() => {
    return subscribeToTasks(
      listId,
      (tasks) => {
        tasksCache.set(listId, tasks);
        setSnapshot({ listId, tasks, error: null });
      },
      (error) => setSnapshot({ listId, tasks: tasksCache.get(listId) ?? [], error })
    );
  }, [listId]);

  const current = snapshot && snapshot.listId === listId ? snapshot : null;

  return {
    tasks: current?.tasks ?? NO_TASKS,
    loading: current === null,
    error: current?.error ?? null,
  };
}
