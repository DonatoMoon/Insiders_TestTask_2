"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToMyLists } from "@/lib/firestore/lists";
import type { TodoList } from "@/lib/types";

export function useLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToMyLists(user.uid, (result) => {
      setLists(result);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { lists, loading };
}
