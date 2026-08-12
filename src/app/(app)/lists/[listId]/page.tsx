"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useListDetail } from "@/hooks/useListDetail";
import { useTasks } from "@/hooks/useTasks";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, PlusIcon } from "@/components/ui/icons";

export default function ListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const { user } = useAuth();
  const { list, role, loading: listLoading } = useListDetail(listId);
  const { tasks, loading: tasksLoading } = useTasks(listId);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const canEdit = role === "owner" || role === "admin";

  if (listLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-ink-soft">Loading…</p>
      </main>
    );
  }

  if (!list) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg">
        <p className="text-ink-soft">This list doesn&apos;t exist, or you don&apos;t have access.</p>
        <Link href="/lists" className="font-bold text-accent-text">
          Back to lists
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1360px] px-10 py-11">
      <Link href="/lists" className="mb-6 inline-flex items-center gap-[0.4rem] text-sm font-bold text-ink-soft hover:text-accent-text">
        <ChevronLeftIcon className="h-[15px] w-[15px]" />
        Back to lists
      </Link>

      <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.75rem] font-bold leading-tight text-ink">{list.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {tasks.filter((t) => t.completed).length} of {tasks.length} done · your role: {role}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setTaskModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Add task
          </Button>
        )}
      </div>

      {tasksLoading ? (
        <p className="text-ink-soft">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-ink-soft">No tasks yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-lg border border-line bg-surface px-5 py-4">
              <span className="font-bold text-ink">{task.title}</span>
              {task.description && <p className="mt-1 text-sm text-ink-soft">{task.description}</p>}
              <p className="mt-1 text-xs text-ink-faint">{task.completed ? "Completed" : "Not completed"}</p>
            </li>
          ))}
        </ul>
      )}

      {canEdit && <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} listId={listId} />}
    </main>
  );
}
