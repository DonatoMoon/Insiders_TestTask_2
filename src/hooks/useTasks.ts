"use client";

import { useEffect, useState } from "react";
import { subscribeToTasks } from "@/lib/firestore/tasks";
import type { Task } from "@/lib/types";

export function useTasks(listId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTasks(listId, (result) => {
      setTasks(result);
      setLoading(false);
    });
    return unsubscribe;
  }, [listId]);

  return { tasks, loading };
}
