"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/lib/auth/authService";
import { Button } from "@/components/ui/Button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !user) {
      router.replace("/login");
    }
  }, [initializing, user, router]);

  if (initializing || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="font-body text-ink-soft">Loading…</p>
      </div>
    );
  }

  async function handleSignOut() {
    try {
      await logoutUser();
    } catch {
      toast.error("Could not sign out, try again");
    }
  }

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-10 py-4">
          <Link href="/lists" className="font-display text-xl font-bold text-ink hover:text-accent-text">
            Together
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden font-body text-sm text-ink-soft sm:inline">
              {user.displayName ?? user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
