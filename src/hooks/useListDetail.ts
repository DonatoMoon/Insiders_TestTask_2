"use client";

import { useEffect, useState } from "react";
import type { FirestoreError } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToList } from "@/lib/firestore/lists";
import type { Role, TodoList } from "@/lib/types";

interface ListSnapshot {
  listId: string;
  list: TodoList | null;
  error: FirestoreError | null;
}

export function useListDetail(listId: string) {
  const { user } = useAuth();
  // The snapshot carries the listId it belongs to, so switching lists reads as
  // "loading" without a setState call in the effect body.
  const [snapshot, setSnapshot] = useState<ListSnapshot | null>(null);

  useEffect(() => {
    return subscribeToList(
      listId,
      (list) => setSnapshot({ listId, list, error: null }),
      (error) => setSnapshot({ listId, list: null, error })
    );
  }, [listId]);

  const current = snapshot && snapshot.listId === listId ? snapshot : null;
  const list = current?.list ?? null;
  const role: Role | null = user && list ? list.members[user.uid] ?? null : null;

  return { list, role, loading: current === null, error: current?.error ?? null };
}
