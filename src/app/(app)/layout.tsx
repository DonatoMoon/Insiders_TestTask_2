"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/lib/auth/authService";


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
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <Link href="/lists" className="group flex items-center gap-2.5 font-display text-xl font-bold text-ink transition-colors hover:text-accent-text">
            <span className="h-6 w-6 rounded-md bg-accent shrink-0 transition-transform group-hover:scale-105" aria-hidden="true" />
            Together
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden font-body text-sm text-ink-soft sm:inline">
              {user.displayName ?? user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-semibold text-ink-faint transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
