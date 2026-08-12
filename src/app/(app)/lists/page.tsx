"use client";

import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/lib/auth/authService";
import { Button } from "@/components/ui/Button";

export default function ListsPage() {
  const { user } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <p className="font-display text-2xl text-ink">Welcome, {user?.displayName ?? user?.email}</p>
      <p className="text-ink-soft">Dashboard placeholder — replaced with the real thing in Task 9.</p>
      <Button variant="ghost" onClick={() => logoutUser()}>
        Sign out
      </Button>
    </main>
  );
}
