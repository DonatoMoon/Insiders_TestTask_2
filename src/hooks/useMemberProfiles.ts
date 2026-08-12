"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/firestore/users";
import type { Role, UserProfile } from "@/lib/types";

export interface MemberEntry {
  uid: string;
  role: Role;
  profile: UserProfile | null;
}

// Module-level cache — survives component unmount/remount (page navigations).
// Profiles rarely change so stale data here is acceptable; the effect below
// still re-fetches to keep things fresh.
const profileCache = new Map<string, UserProfile | null>();

function parseKey(key: string): { uid: string; role: Role }[] {
  if (key.length === 0) return [];
  return key.split(",").map((pair) => {
    const [uid, role] = pair.split(":");
    return { uid, role: role as Role };
  });
}

export function useMemberProfiles(members: Record<string, Role>): MemberEntry[] {
  // The parent's `members` object gets a fresh identity on every list-document
  // emission, so depending on it directly refetches every profile on unrelated
  // writes. This primitive key changes only when a uid or role actually does —
  // and it fully describes what the effect needs, so the effect reads from it.
  const membersKey = Object.entries(members)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([uid, role]) => `${uid}:${role}`)
    .join(",");

  // Initialise from cache immediately — no empty-array flash on re-mount when
  // all profiles were already fetched during a previous visit.
  const [entries, setEntries] = useState<MemberEntry[]>(() => {
    const pairs = parseKey(membersKey);
    if (pairs.length > 0 && pairs.every((p) => profileCache.has(p.uid))) {
      return pairs.map((p) => ({ ...p, profile: profileCache.get(p.uid) ?? null }));
    }
    return [];
  });

  useEffect(() => {
    let cancelled = false;
    const pairs = parseKey(membersKey);

    // If everything is already cached, update state synchronously and skip fetch.
    if (pairs.length > 0 && pairs.every((p) => profileCache.has(p.uid))) {
      setEntries(pairs.map((p) => ({ ...p, profile: profileCache.get(p.uid) ?? null })));
      return;
    }

    Promise.all(
      pairs.map((pair) => {
        if (profileCache.has(pair.uid)) {
          return Promise.resolve(profileCache.get(pair.uid) ?? null);
        }
        return getUserProfile(pair.uid).then((profile) => {
          profileCache.set(pair.uid, profile);
          return profile;
        });
      })
    )
      .then((profiles) => {
        if (cancelled) return;
        setEntries(pairs.map((pair, i) => ({ ...pair, profile: profiles[i] })));
      })
      .catch(() => {
        // A failed lookup shouldn't leave the panel empty or blow up as an
        // unhandled rejection — still show the membership, just without names.
        if (cancelled) return;
        setEntries(pairs.map((pair) => ({ ...pair, profile: profileCache.get(pair.uid) ?? null })));
      });
    return () => {
      cancelled = true;
    };
  }, [membersKey]);

  return entries;
}
