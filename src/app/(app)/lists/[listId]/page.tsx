"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useListDetail } from "@/hooks/useListDetail";
import { useTasks } from "@/hooks/useTasks";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, PlusIcon } from "@/components/ui/icons";
import type { Task } from "@/lib/types";

export default function ListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const { user } = useAuth();
  const { list, role, loading: listLoading } = useListDetail(listId);
  const { tasks, loading: tasksLoading } = useTasks(listId);
  const [taskModalTarget, setTaskModalTarget] = useState<Task | "new" | null>(null);

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

  const editingTask = taskModalTarget && taskModalTarget !== "new" ? taskModalTarget : undefined;

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
          <Button onClick={() => setTaskModalTarget("new")}>
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
            <TaskItem
              key={task.id}
              task={task}
              listId={listId}
              canEdit={canEdit}
              onEdit={() => setTaskModalTarget(task)}
            />
          ))}
        </ul>
      )}

      {canEdit && (
        <TaskModal
          open={taskModalTarget !== null}
          onClose={() => setTaskModalTarget(null)}
          listId={listId}
          initial={editingTask ? { id: editingTask.id, title: editingTask.title, description: editingTask.description } : undefined}
        />
      )}
    </main>
  );
}
