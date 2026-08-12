"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";
import { KeyIcon, WrenchIcon, EyeIcon, KebabIcon } from "@/components/ui/icons";
import type { Role, TodoList } from "@/lib/types";

const roleMeta: Record<Role, { label: string; icon: typeof KeyIcon; classes: string }> = {
  owner: { label: "owner", icon: KeyIcon, classes: "text-accent-text bg-accent-soft" },
  admin: { label: "admin", icon: WrenchIcon, classes: "text-gold-text bg-gold-soft" },
  viewer: { label: "viewer", icon: EyeIcon, classes: "text-sage-text bg-sage-soft" },
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
  const memberCount = Object.keys(list.members).length;
  const tilt = useMemo(() => tiltFromId(list.id), [list.id]);

  return (
    <article
      style={{ "--tilt": tilt } as CSSProperties}
      className="relative rotate-[var(--tilt)] rounded-card border border-line bg-surface p-[1.4rem] shadow-rest transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-lift"
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
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-ink-faint hover:bg-surface-sunk hover:text-ink"
            >
              <KebabIcon className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-10 flex min-w-[150px] flex-col gap-1 rounded-lg border border-line bg-surface p-[0.35rem] shadow-lift">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename();
                  }}
                  className="rounded-md px-[0.65rem] py-2 text-left text-sm font-semibold hover:bg-surface-sunk"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
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
        <Link href={`/lists/${list.id}`} className="hover:text-accent-text">
          {list.title}
        </Link>
      </h3>

      <div className="mb-1 text-xs text-ink-faint">Updated {formatRelativeTime(list.updatedAt)}</div>
      <div className="text-xs text-ink-faint">
        {memberCount} member{memberCount === 1 ? "" : "s"}
      </div>
    </article>
  );
}
