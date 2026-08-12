"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToList } from "@/lib/firestore/lists";
import type { Role, TodoList } from "@/lib/types";

export function useListDetail(listId: string) {
  const { user } = useAuth();
  const [list, setList] = useState<TodoList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToList(listId, (result) => {
      setList(result);
      setLoading(false);
    });
    return unsubscribe;
  }, [listId]);

  const role: Role | null = user && list ? list.members[user.uid] ?? null : null;

  return { list, role, loading };
}
