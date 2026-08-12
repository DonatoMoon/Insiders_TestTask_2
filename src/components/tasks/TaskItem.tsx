"use client";

import { useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toggleTaskCompleted, deleteTask } from "@/lib/firestore/tasks";
import { CheckIcon, PencilIcon, TrashIcon, GripVerticalIcon } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  listId: string;
  canEdit: boolean;
  onEdit: () => void;
}

export function TaskItem({ task, listId, canEdit, onEdit }: TaskItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 30 : 1 }}
      className="relative flex items-start gap-4 rounded-lg border border-l-[3px] border-dashed border-line border-l-line-strong bg-surface px-[1.15rem] py-[1.05rem] pl-[1.7rem]"
    >
      {canEdit && (
        <button
          type="button"
          aria-label="Drag to reorder task"
          className="mt-1 flex-none cursor-grab touch-none text-ink-soft hover:text-ink active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-5 w-5" />
        </button>
      )}
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? "Mark as not completed" : "Mark as completed"}
        onClick={async () => {
          try {
            await toggleTaskCompleted(listId, task.id, !task.completed);
          } catch {
            toast.error("Something went wrong, try again");
          }
        }}
        className={clsx(
          "mt-0.5 flex h-[25px] w-[25px] flex-none items-center justify-center rounded-[7px] border-[1.8px] transition-colors",
          task.completed ? "border-sage bg-sage-soft" : "border-line-strong bg-surface"
        )}
      >
        <CheckIcon
          className="h-[15px] w-[15px] text-sage-text transition-[stroke-dashoffset] duration-300"
          style={{ strokeDasharray: 20, strokeDashoffset: task.completed ? 0 : 20 }}
        />
      </button>

      <div className="min-w-0 flex-1">
        <span className="relative inline-block text-lg font-bold">
          <span className={task.completed ? "text-ink-soft" : "text-ink"}>{task.title}</span>
          <span
            className={clsx(
              "absolute left-0 top-1/2 h-[2px] w-full origin-left bg-sage-text transition-transform duration-300",
              task.completed ? "scale-x-100" : "scale-x-0"
            )}
          />
        </span>
        {task.description && (
          <p className={clsx("mt-1 text-sm", task.completed ? "text-ink-faint" : "text-ink-soft")}>{task.description}</p>
        )}
      </div>

      {canEdit && (
        <div className="mt-0.5 flex flex-none gap-[0.4rem]">
          <button
            type="button"
            aria-label="Edit"
            onClick={onEdit}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-sunk text-ink-soft hover:border-accent hover:text-accent-text"
          >
            <PencilIcon className="h-[15px] w-[15px]" />
          </button>
          <button
            type="button"
            aria-label="Delete"
            onClick={() => setConfirmOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-sunk text-ink-soft hover:border-danger hover:text-danger"
          >
            <TrashIcon className="h-[15px] w-[15px]" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete task?"
        body={`"${task.title}" will be permanently deleted. This can't be undone.`}
        onConfirm={async () => {
          try {
            await deleteTask(listId, task.id);
            toast.success("Task deleted");
          } catch {
            toast.error("Something went wrong, try again");
          }
        }}
      />
    </li>
  );
}
