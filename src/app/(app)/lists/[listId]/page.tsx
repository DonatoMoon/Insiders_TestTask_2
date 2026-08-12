"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { updateTasksOrder } from "@/lib/firestore/tasks";
import { useAuth } from "@/hooks/useAuth";
import { useListDetail } from "@/hooks/useListDetail";
import { useTasks } from "@/hooks/useTasks";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskItem } from "@/components/tasks/TaskItem";
import { MembersPanel } from "@/components/lists/MembersPanel";
import { ChevronLeftIcon, PlusIcon } from "@/components/ui/icons";
import type { Task } from "@/lib/types";

export default function ListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { list, role, loading: listLoading, error: listError } = useListDetail(listId);
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(listId);
  const [taskModalTarget, setTaskModalTarget] = useState<Task | "new" | null>(null);

  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localTasks.findIndex((t) => t.id === active.id);
      const newIndex = localTasks.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localTasks, oldIndex, newIndex);
        setLocalTasks(reordered);
        const updates = reordered.map((task, index) => ({ id: task.id, order: index }));
        updateTasksOrder(listId, updates).catch(() => {
          toast.error("Failed to save new order");
        });
      }
    }
  };

  const canEdit = role === "owner" || role === "admin";
  const editingTask = taskModalTarget && taskModalTarget !== "new" ? taskModalTarget : undefined;

  // `editingTask` is the `taskModalTarget` state value itself, so its identity
  // is stable across re-renders; memoising on it keeps the `initial` object
  // stable too. Without this the fresh object literal re-fired the modal's
  // reset effect on every unrelated re-render (a sibling task toggling, say)
  // and discarded whatever the user had typed.
  const taskInitial = useMemo(
    () =>
      editingTask
        ? { id: editingTask.id, title: editingTask.title, description: editingTask.description }
        : undefined,
    [editingTask]
  );

  // A live subscription can start failing while the page is open — e.g. the
  // owner removes this member. Send them back rather than showing stale data.
  const accessRevoked = listError?.code === "permission-denied" || tasksError?.code === "permission-denied";
  useEffect(() => {
    if (!accessRevoked) return;
    toast.error("You no longer have access to this list");
    router.replace("/lists");
  }, [accessRevoked, router]);

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
    <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 sm:py-9 lg:px-10 lg:py-11">
      <Link href="/lists" className="mb-6 inline-flex items-center gap-[0.4rem] text-sm font-bold text-ink-soft hover:text-accent-text">
        <ChevronLeftIcon className="h-[15px] w-[15px]" />
        Back to lists
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-9">
        <div>
          <h1 className="font-display text-[1.9rem] font-bold leading-tight text-ink sm:text-[2.75rem]">{list.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {localTasks.filter((t) => t.completed).length} of {localTasks.length} done · your role: {role}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setTaskModalTarget("new")}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-[0.65rem] text-sm font-bold text-surface transition-transform hover:scale-[1.02] active:scale-100"
          >
            <PlusIcon className="h-4 w-4" />
            Add task
          </button>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px] lg:gap-10">
        <div>
          {tasksError ? (
            <p className="text-danger">We couldn&apos;t load these tasks. Refresh the page to try again.</p>
          ) : tasksLoading ? (
            <p className="text-ink-soft">Loading tasks…</p>
          ) : localTasks.length === 0 ? (
            <p className="text-ink-soft">No tasks yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-3">
                  {localTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      listId={listId}
                      canEdit={canEdit}
                      onEdit={() => setTaskModalTarget(task)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <MembersPanel listId={listId} members={list.members} isOwner={role === "owner"} currentUid={user.uid} />
      </div>

      {canEdit && (
        <TaskModal
          open={taskModalTarget !== null}
          onClose={() => setTaskModalTarget(null)}
          listId={listId}
          initial={taskInitial}
        />
      )}
    </main>
  );
}
