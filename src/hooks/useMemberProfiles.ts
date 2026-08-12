"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/firestore/users";
import type { Role, UserProfile } from "@/lib/types";

export interface MemberEntry {
  uid: string;
  role: Role;
  profile: UserProfile | null;
}

export function useMemberProfiles(members: Record<string, Role>): MemberEntry[] {
  const [entries, setEntries] = useState<MemberEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const uids = Object.keys(members);
    Promise.all(uids.map((uid) => getUserProfile(uid))).then((profiles) => {
      if (cancelled) return;
      setEntries(uids.map((uid, i) => ({ uid, role: members[uid], profile: profiles[i] })));
    });
    return () => {
      cancelled = true;
    };
  }, [members]);

  return entries;
}
