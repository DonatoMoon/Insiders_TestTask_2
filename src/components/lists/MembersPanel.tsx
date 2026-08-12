"use client";

import { useState } from "react";
import { toast } from "sonner";
import { removeMember } from "@/lib/firestore/lists";
import { useMemberProfiles } from "@/hooks/useMemberProfiles";
import { AddMemberModal } from "@/components/lists/AddMemberModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PlusIcon, CloseIcon } from "@/components/ui/icons";
import type { Role } from "@/lib/types";

interface MembersPanelProps {
  listId: string;
  members: Record<string, Role>;
  isOwner: boolean;
  currentUid: string;
}

const avatarClasses: Record<Role, string> = {
  owner: "bg-accent-soft",
  admin: "bg-gold-soft",
  viewer: "bg-sage-soft",
};

export function MembersPanel({ listId, members, isOwner, currentUid }: MembersPanelProps) {
  const entries = useMemberProfiles(members);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ uid: string; label: string } | null>(null);

  return (
    <aside className="sticky top-[100px] rounded-card border border-line bg-surface p-[1.35rem]">
      <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ink-soft">
        Members
        {isOwner && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1 normal-case tracking-normal text-accent-text"
          >
            <PlusIcon className="h-[13px] w-[13px]" />
            Invite
          </button>
        )}
      </div>
      <ul className="flex flex-col">
        {entries.map((entry) => {
          const displayName = entry.profile?.name ?? "Unknown user";
          const label = entry.uid === currentUid ? `${displayName} (you)` : displayName;
          return (
            <li key={entry.uid} className="flex items-center gap-[0.6rem] border-t border-dashed border-line py-2 first:border-t-0">
              <span
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-full font-display text-xs font-semibold ${avatarClasses[entry.role]}`}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{label}</span>
                <span className="text-xs text-ink-faint">{entry.role}</span>
              </span>
              {isOwner && entry.role !== "owner" && (
                <button
                  type="button"
                  aria-label={`Remove ${displayName}`}
                  onClick={() => setRemoveTarget({ uid: entry.uid, label: displayName })}
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-ink-faint hover:bg-danger-soft hover:text-danger"
                >
                  <CloseIcon className="h-[14px] w-[14px]" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {isOwner && <AddMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} listId={listId} />}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove member?"
        body={`${removeTarget?.label} will lose access to this list immediately.`}
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!removeTarget) return;
          try {
            await removeMember(listId, removeTarget.uid);
            toast.success("Member removed");
          } catch {
            toast.error("Something went wrong, try again");
          }
        }}
      />
    </aside>
  );
}
