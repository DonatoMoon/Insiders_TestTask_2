"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    router.replace(user ? "/lists" : "/login");
  }, [user, initializing, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="font-body text-ink-soft">Loading…</p>
    </div>
  );
}
