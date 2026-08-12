"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import { deleteList } from "@/lib/firestore/lists";
import { CreateListModal } from "@/components/lists/CreateListModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListCard } from "@/components/lists/ListCard";
import { Select } from "@/components/ui/Select";
import { SearchIcon } from "@/components/ui/icons";
import { toast } from "sonner";
import type { TodoList } from "@/lib/types";

type SortOption = "updated" | "name";

export default function ListsPage() {
  const { user } = useAuth();
  const { lists, loading, error } = useLists();
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

  // `renameTarget` is state, so its identity is stable across re-renders;
  // memoising on it keeps the `initial` object stable too. Without this the
  // fresh object literal re-fired the modal's reset effect on every unrelated
  // re-render (a realtime list update, say) and wiped the user's typing.
  const renameInitial = useMemo(
    () => (renameTarget ? { id: renameTarget.id, title: renameTarget.title } : undefined),
    [renameTarget]
  );

  // Stat pills use the full unfiltered `lists` so they don't shift while
  // the user is mid-search — only the rendered groups below use `filtered`.
  const sharedCount = user ? lists.filter((l) => l.members[user.uid] !== "owner").length : 0;
  const ownLists = filtered.filter((l) => user && l.members[user.uid] === "owner");
  const sharedLists = filtered.filter((l) => user && l.members[user.uid] !== "owner");

  if (!user) return null;

  return (
    <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 sm:py-9 lg:px-10 lg:py-11">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-9 sm:gap-6">
        <div>
          <h1 className="font-display text-[1.9rem] font-bold leading-tight text-ink sm:text-[2.75rem]">
            Welcome back, {user.displayName ?? user.email}
          </h1>
          <span className="mt-1 block -rotate-1 font-hand text-[1.1rem] text-accent-text sm:text-[1.3rem]">
            here&apos;s what&apos;s moving across your lists
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-[0.4rem] text-sm font-medium text-ink-soft">
            <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-surface-sunk px-2 text-xs font-bold text-ink">
              {lists.length}
            </span>
            Lists
          </div>
          <div className="flex items-center gap-[0.4rem] text-sm font-medium text-ink-soft">
            <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-surface-sunk px-2 text-xs font-bold text-ink">
              {sharedCount}
            </span>
            Shared
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-3">
          <div className="relative flex-1 sm:max-w-[280px]">
            <SearchIcon className="pointer-events-none absolute left-[0.85rem] top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lists..."
              className="w-full rounded-full border border-line bg-surface-sunk py-[0.65rem] pl-[2.4rem] pr-[0.9rem] text-sm"
            />
          </div>
          <div className="relative">
            <Select
              value={sort}
              onChange={(val) => setSort(val as SortOption)}
              options={[
                { value: "updated", label: "Sort: Recently updated" },
                { value: "name", label: "Sort: Name (A–Z)" },
              ]}
              className="rounded-lg border border-line-strong bg-surface py-[0.65rem] px-[0.9rem] text-sm font-semibold hover:border-ink-faint focus-visible:border-accent"
            />
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full rounded-full bg-ink px-5 py-[0.65rem] text-sm font-bold text-surface transition-transform hover:scale-[1.02] active:scale-100 sm:ml-auto sm:w-auto"
        >
          Create new list
        </button>
      </div>

      {error ? (
        <p className="text-danger">We couldn&apos;t load your lists. Refresh the page to try again.</p>
      ) : loading ? (
        <p className="text-ink-soft">Loading lists…</p>
      ) : (
        <>
          <ListGroup title="Your lists" lists={ownLists} userUid={user.uid} onRename={setRenameTarget} onDelete={setDeleteTarget} />
          <div className="mt-8 sm:mt-11">
            <ListGroup title="Shared with you" lists={sharedLists} userUid={user.uid} onRename={setRenameTarget} onDelete={setDeleteTarget} />
          </div>
        </>
      )}

      <CreateListModal open={createOpen} onClose={() => setCreateOpen(false)} ownerId={user.uid} />
      <CreateListModal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        ownerId={user.uid}
        initial={renameInitial}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete list?"
        body={`"${deleteTarget?.title}" and all its tasks will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteList(deleteTarget.id);
            toast.success("List deleted");
          } catch {
            toast.error("Something went wrong, try again");
          }
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
      <h2 className="mb-4 font-display text-[1.4rem] font-semibold text-ink sm:mb-[1.15rem] sm:text-[1.75rem]">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4 sm:gap-7">
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
