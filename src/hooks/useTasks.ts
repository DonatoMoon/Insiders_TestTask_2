"use client";

import { useEffect, useState } from "react";
import type { FirestoreError } from "firebase/firestore";
import { subscribeToTasks } from "@/lib/firestore/tasks";
import type { Task } from "@/lib/types";

// Stable empty reference so consumers don't see a new array every render.
const NO_TASKS: Task[] = [];

interface TasksSnapshot {
  listId: string;
  tasks: Task[];
  error: FirestoreError | null;
}

export function useTasks(listId: string) {
  // The snapshot carries the listId it belongs to, so switching lists reads as
  // "loading" without a setState call in the effect body.
  const [snapshot, setSnapshot] = useState<TasksSnapshot | null>(null);

  useEffect(() => {
    return subscribeToTasks(
      listId,
      (tasks) => setSnapshot({ listId, tasks, error: null }),
      (error) => setSnapshot({ listId, tasks: [], error })
    );
  }, [listId]);

  const current = snapshot && snapshot.listId === listId ? snapshot : null;

  return {
    tasks: current?.tasks ?? NO_TASKS,
    loading: current === null,
    error: current?.error ?? null,
  };
}
