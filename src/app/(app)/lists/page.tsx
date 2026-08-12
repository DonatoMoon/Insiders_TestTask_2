"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import { logoutUser } from "@/lib/auth/authService";
import { createList } from "@/lib/firestore/lists";
import { Button } from "@/components/ui/Button";

export default function ListsPage() {
  const { user } = useAuth();
  const { lists, loading } = useLists();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <p className="font-display text-2xl text-ink">Welcome, {user?.displayName ?? user?.email}</p>
      <p className="text-ink-soft">Dashboard placeholder — replaced with the real thing in Task 9.</p>
      <p className="text-ink-soft">{loading ? "Loading lists…" : `${lists.length} list(s): ${lists.map((l) => l.title).join(", ")}`}</p>
      <Button onClick={() => user && createList("Office Move", user.uid)}>DEBUG: create test list</Button>
      <Button variant="ghost" onClick={() => logoutUser()}>
        Sign out
      </Button>
    </main>
  );
}
