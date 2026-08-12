"use client";

import { useEffect, useState } from "react";
import type { FirestoreError } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToMyLists } from "@/lib/firestore/lists";
import type { TodoList } from "@/lib/types";

// Stable empty reference so consumers don't see a new array every render.
const NO_LISTS: TodoList[] = [];

interface ListsSnapshot {
  uid: string;
  lists: TodoList[];
  error: FirestoreError | null;
}

export function useLists() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  // The snapshot carries the uid it belongs to, so `loading` can be derived
  // rather than reset with a setState call in the effect body.
  const [snapshot, setSnapshot] = useState<ListsSnapshot | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeToMyLists(
      uid,
      (lists) => setSnapshot({ uid, lists, error: null }),
      (error) => setSnapshot({ uid, lists: [], error })
    );
  }, [uid]);

  const current = snapshot && snapshot.uid === uid ? snapshot : null;

  return {
    lists: current?.lists ?? NO_LISTS,
    loading: uid !== null && current === null,
    error: current?.error ?? null,
  };
}
