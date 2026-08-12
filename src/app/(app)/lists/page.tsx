"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import { deleteList } from "@/lib/firestore/lists";
import { CreateListModal } from "@/components/lists/CreateListModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListCard } from "@/components/lists/ListCard";
import { Button } from "@/components/ui/Button";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { toast } from "sonner";
import type { TodoList } from "@/lib/types";

type SortOption = "updated" | "name";

export default function ListsPage() {
  const { user } = useAuth();
  const { lists, loading } = useLists();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("updated");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<TodoList | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TodoList | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = term ? lists.filter((l) => l.title.toLowerCase().includes(term)) : lists;
    return [...result].sort((a, b) => (sort === "name" ? a.title.localeCompare(b.title) : b.updatedAt - a.updatedAt));
  }, [lists, search, sort]);

  // Stat pills use the full unfiltered `lists` so they don't shift while
  // the user is mid-search — only the rendered groups below use `filtered`.
  const sharedCount = user ? lists.filter((l) => l.members[user.uid] !== "owner").length : 0;
  const ownLists = filtered.filter((l) => user && l.members[user.uid] === "owner");
  const sharedLists = filtered.filter((l) => user && l.members[user.uid] !== "owner");

  if (!user) return null;

  return (
    <main className="mx-auto max-w-[1360px] px-10 py-11">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[2.75rem] font-bold leading-tight text-ink">
            Welcome back, {user.displayName ?? user.email}
          </h1>
          <span className="mt-1 block -rotate-1 font-hand text-[1.3rem] text-accent-text">
            here&apos;s what&apos;s moving across your lists
          </span>
        </div>
        <div className="flex gap-[0.9rem]">
          <div className="min-w-[130px] rounded-xl border border-line bg-surface px-[1.15rem] py-[0.85rem]">
            <b className="block font-display text-xl">{lists.length}</b>
            <span className="text-xs text-ink-soft">Lists</span>
          </div>
          <div className="min-w-[130px] rounded-xl border border-line bg-surface px-[1.15rem] py-[0.85rem]">
            <b className="block font-display text-xl">{sharedCount}</b>
            <span className="text-xs text-ink-soft">Shared with you</span>
          </div>
        </div>
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div className="relative max-w-[280px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-[0.85rem] top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lists..."
            className="w-full rounded-full border border-line bg-surface-sunk py-[0.65rem] pl-[2.4rem] pr-[0.9rem] text-sm"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-line-strong bg-surface px-[0.9rem] py-[0.65rem] text-sm font-semibold"
        >
          <option value="updated">Sort: Recently updated</option>
          <option value="name">Sort: Name (A–Z)</option>
        </select>
        <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          New list
        </Button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Loading lists…</p>
      ) : (
        <>
          <ListGroup title="Your lists" lists={ownLists} userUid={user.uid} onRename={setRenameTarget} onDelete={setDeleteTarget} />
          <div className="mt-11">
            <ListGroup title="Shared with you" lists={sharedLists} userUid={user.uid} onRename={setRenameTarget} onDelete={setDeleteTarget} />
          </div>
        </>
      )}

      <CreateListModal open={createOpen} onClose={() => setCreateOpen(false)} ownerId={user.uid} />
      <CreateListModal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        ownerId={user.uid}
        initial={renameTarget ? { id: renameTarget.id, title: renameTarget.title } : undefined}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete list?"
        body={`"${deleteTarget?.title}" and all its tasks will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteList(deleteTarget.id);
          toast.success("List deleted");
        }}
      />
    </main>
  );
}

function ListGroup({
  title,
  lists,
  userUid,
  onRename,
  onDelete,
}: {
  title: string;
  lists: TodoList[];
  userUid: string;
  onRename: (list: TodoList) => void;
  onDelete: (list: TodoList) => void;
}) {
  if (lists.length === 0) return null;
  return (
    <section>
      <h2 className="mb-[1.15rem] font-display text-[1.75rem] font-semibold text-ink">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-7">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            role={list.members[userUid]}
            onRename={() => onRename(list)}
            onDelete={() => onDelete(list)}
          />
        ))}
      </div>
    </section>
  );
}
