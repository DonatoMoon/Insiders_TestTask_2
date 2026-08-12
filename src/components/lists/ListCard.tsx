"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";
import { KeyIcon, WrenchIcon, EyeIcon, KebabIcon } from "@/components/ui/icons";
import { useTasks } from "@/hooks/useTasks";
import { useMemberProfiles } from "@/hooks/useMemberProfiles";
import type { Role, TodoList } from "@/lib/types";

const roleMeta: Record<Role, { label: string; icon: typeof KeyIcon; classes: string }> = {
  owner: { label: "owner", icon: KeyIcon, classes: "text-accent-text bg-accent-soft" },
  admin: { label: "admin", icon: WrenchIcon, classes: "text-gold-text bg-gold-soft" },
  viewer: { label: "viewer", icon: EyeIcon, classes: "text-sage-text bg-sage-soft" },
};

const avatarBg: Record<Role, string> = {
  owner: "bg-accent-soft",
  admin: "bg-gold-soft",
  viewer: "bg-sage-soft",
};

// The "pinned note" tilt has to look random but stay put across re-renders, so
// it's derived from the list id rather than Math.random(). Range: -1.5°…1.5°.
function tiltFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  }
  return `${((hash / 999) * 3 - 1.5).toFixed(2)}deg`;
}

// Progress squares — adapts to task count:
//   ≤12 tasks → normal size squares
//   13–24     → compact squares
//   25+       → show 24 squares + "+N more" label
const NORMAL_MAX = 12;
const COMPACT_MAX = 24;

function ProgressSquares({ total, done }: { total: number; done: number }) {
  if (total === 0) return null;

  const compact = total > NORMAL_MAX;
  const overflow = total > COMPACT_MAX ? total - COMPACT_MAX : 0;
  const visible = overflow > 0 ? COMPACT_MAX : total;

  const squareClass = compact
    ? "h-[7px] w-[7px] rounded-[2px]"
    : "h-[9px] w-[9px] rounded-[2px]";

  return (
    <div className="mb-2 flex items-center gap-2">
      <div className={`flex flex-wrap ${compact ? "gap-[3px]" : "gap-[4px]"}`}>
        {Array.from({ length: visible }, (_, i) => (
          <span
            key={i}
            className={`${squareClass} ${
              i < done ? "bg-sage" : "bg-surface-sunk"
            } transition-colors duration-200`}
          />
        ))}
        {overflow > 0 && (
          <span className="ml-1 self-center text-[10px] font-semibold text-ink-faint">
            +{overflow}
          </span>
        )}
      </div>
      <span className="text-xs font-semibold text-ink-soft">
        {done} of {total}
      </span>
    </div>
  );
}

// Member avatars — max 5 visible, rest collapsed into "+N"
const MAX_AVATARS = 5;

function MemberAvatars({ members }: { members: Record<string, Role> }) {
  const entries = useMemberProfiles(members);
  if (entries.length === 0) return null;

  const visible = entries.slice(0, MAX_AVATARS);
  const overflow = entries.length - MAX_AVATARS;

  return (
    <div className="mt-3 flex items-center gap-[6px]">
      {visible.map((entry) => {
        const name = entry.profile?.name ?? "?";
        const initial = name.charAt(0).toUpperCase();
        return (
          <span
            key={entry.uid}
            title={name}
            className={`flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full font-display text-[11px] font-bold ${avatarBg[entry.role]}`}
          >
            {initial}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full bg-surface-sunk font-display text-[11px] font-bold text-ink-soft">
          +{overflow}
        </span>
      )}
    </div>
  );
}

interface ListCardProps {
  list: TodoList;
  role: Role;
  onRename: () => void;
  onDelete: () => void;
}

export function ListCard({ list, role, onRename, onDelete }: ListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = roleMeta[role];
  const RoleIcon = meta.icon;
  const tilt = useMemo(() => tiltFromId(list.id), [list.id]);

  const { tasks } = useTasks(list.id);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.completed).length;

  return (
    <article
      style={{ "--tilt": tilt } as CSSProperties}
      className="relative flex flex-col rotate-[var(--tilt)] rounded-card border border-line bg-surface p-[1.4rem] shadow-rest transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-lift"
    >
      <div className="mb-[0.85rem] flex items-start justify-between gap-2">
        <span
          className={`inline-flex -rotate-[4deg] items-center gap-[0.35rem] rounded-full border border-dashed border-current px-[0.6rem] py-[0.32rem] text-[0.72rem] font-bold ${meta.classes}`}
        >
          <RoleIcon className="h-3 w-3" />
          {meta.label}
        </span>
        {role === "owner" && (
          <div className="relative">
            <button
              type="button"
              aria-label="List options"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen((v) => !v);
              }}
              className="relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full text-ink-faint hover:bg-surface-sunk hover:text-ink"
            >
              <KebabIcon className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-10 flex min-w-[150px] flex-col gap-1 rounded-lg border border-line bg-surface p-[0.35rem] shadow-lift">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onRename();
                  }}
                  className="rounded-md px-[0.65rem] py-2 text-left text-sm font-semibold hover:bg-surface-sunk"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="rounded-md px-[0.65rem] py-2 text-left text-sm font-semibold text-danger hover:bg-surface-sunk"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <h3 className="mb-3 font-display text-xl font-semibold text-ink">
        <Link href={`/lists/${list.id}`} className="before:absolute before:inset-0 hover:text-accent-text">
          {list.title}
        </Link>
      </h3>

      <ProgressSquares total={totalTasks} done={doneTasks} />

      <div className="mt-auto pt-2">
        <div className="text-xs text-ink-faint">Updated {formatRelativeTime(list.updatedAt)}</div>
        <MemberAvatars members={list.members} />
      </div>
    </article>
  );
}
