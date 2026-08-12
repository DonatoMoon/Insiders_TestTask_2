"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import { logoutUser } from "@/lib/auth/authService";
import { CreateListModal } from "@/components/lists/CreateListModal";
import { Button } from "@/components/ui/Button";

export default function ListsPage() {
  const { user } = useAuth();
  const { lists, loading } = useLists();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <p className="font-display text-2xl text-ink">Welcome, {user?.displayName ?? user?.email}</p>
      <p className="text-ink-soft">Dashboard placeholder — replaced with the real thing in Task 9.</p>
      <p className="text-ink-soft">{loading ? "Loading lists…" : `${lists.length} list(s): ${lists.map((l) => l.title).join(", ")}`}</p>
      <Button onClick={() => setCreateOpen(true)}>New list</Button>
      <Button variant="ghost" onClick={() => logoutUser()}>
        Sign out
      </Button>
      {user && <CreateListModal open={createOpen} onClose={() => setCreateOpen(false)} ownerId={user.uid} />}
    </main>
  );
}
