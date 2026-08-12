"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/firestore/users";
import type { Role, UserProfile } from "@/lib/types";

export interface MemberEntry {
  uid: string;
  role: Role;
  profile: UserProfile | null;
}

function parseKey(key: string): { uid: string; role: Role }[] {
  if (key.length === 0) return [];
  return key.split(",").map((pair) => {
    const [uid, role] = pair.split(":");
    return { uid, role: role as Role };
  });
}

export function useMemberProfiles(members: Record<string, Role>): MemberEntry[] {
  const [entries, setEntries] = useState<MemberEntry[]>([]);

  // The parent's `members` object gets a fresh identity on every list-document
  // emission, so depending on it directly refetches every profile on unrelated
  // writes. This primitive key changes only when a uid or role actually does —
  // and it fully describes what the effect needs, so the effect reads from it.
  const membersKey = Object.entries(members)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([uid, role]) => `${uid}:${role}`)
    .join(",");

  useEffect(() => {
    let cancelled = false;
    const pairs = parseKey(membersKey);
    Promise.all(pairs.map((pair) => getUserProfile(pair.uid)))
      .then((profiles) => {
        if (cancelled) return;
        setEntries(pairs.map((pair, i) => ({ ...pair, profile: profiles[i] })));
      })
      .catch(() => {
        // A failed lookup shouldn't leave the panel empty or blow up as an
        // unhandled rejection — still show the membership, just without names.
        if (cancelled) return;
        setEntries(pairs.map((pair) => ({ ...pair, profile: null })));
      });
    return () => {
      cancelled = true;
    };
  }, [membersKey]);

  return entries;
}
