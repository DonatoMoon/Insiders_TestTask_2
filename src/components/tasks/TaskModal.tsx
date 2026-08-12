"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { taskSchema, TaskFormValues } from "@/lib/validation/schemas";
import { createTask, updateTask } from "@/lib/firestore/tasks";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface-sunk px-[0.9rem] py-3 text-base text-ink placeholder:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  initial?: { id: string; title: string; description: string };
}

export function TaskModal({ open, onClose, listId, initial }: TaskModalProps) {
  const isEdit = Boolean(initial);
  // The schema's `description` field is optional on input but defaulted to
  // "" on output, so the input/output generics differ (a known zod +
  // zodResolver quirk with `.default()`) — spelling both out here keeps
  // `useForm` and `onSubmit` correctly typed instead of using `any`.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof taskSchema>, unknown, TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: initial?.title ?? "", description: initial?.description ?? "" },
  });

  // Keyed on `open` (not just `initial`) so the form resets every time the
  // modal opens, even in "create" mode where `initial` is undefined/stable
  // across opens and would otherwise never re-trigger this effect (see
  // Task 8's CreateListModal fix for the same bug pattern).
  useEffect(() => {
    if (open) reset({ title: initial?.title ?? "", description: initial?.description ?? "" });
  }, [open, initial, reset]);

  async function onSubmit(values: TaskFormValues) {
    try {
      if (isEdit && initial) {
        await updateTask(listId, initial.id, { title: values.title, description: values.description ?? "" });
        toast.success("Task saved");
      } else {
        await createTask(listId, values.title, values.description ?? "");
        toast.success("Task added");
      }
      onClose();
    } catch {
      toast.error("Something went wrong, try again");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit task" : "New task"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Title" htmlFor="task-title-input" error={errors.title?.message}>
          <input
            id="task-title-input"
            type="text"
            placeholder="e.g. Book a moving truck"
            className={inputClass}
            autoFocus
            {...register("title")}
          />
        </Field>
        <Field label="Description" htmlFor="task-desc-input" error={errors.description?.message}>
          <textarea
            id="task-desc-input"
            placeholder="Add more detail (optional)"
            rows={3}
            className={inputClass}
            {...register("description")}
          />
        </Field>
        <div className="mt-2 flex justify-end gap-[0.6rem]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? "Save task" : "Add task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
