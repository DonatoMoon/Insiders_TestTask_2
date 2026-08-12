"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { listSchema, ListFormValues } from "@/lib/validation/schemas";
import { createList, renameList } from "@/lib/firestore/lists";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface-sunk px-[0.9rem] py-3 text-base text-ink placeholder:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

interface CreateListModalProps {
  open: boolean;
  onClose: () => void;
  ownerId: string;
  initial?: { id: string; title: string };
}

export function CreateListModal({ open, onClose, ownerId, initial }: CreateListModalProps) {
  const isRename = Boolean(initial);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ListFormValues>({ resolver: zodResolver(listSchema), defaultValues: { title: initial?.title ?? "" } });

  useEffect(() => {
    reset({ title: initial?.title ?? "" });
  }, [initial, reset]);

  async function onSubmit(values: ListFormValues) {
    try {
      if (isRename && initial) {
        await renameList(initial.id, values.title);
        toast.success("List renamed");
      } else {
        await createList(values.title, ownerId);
        toast.success("List created");
      }
      onClose();
    } catch {
      toast.error("Something went wrong, try again");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isRename ? "Rename list" : "New list"}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Field label="List name" htmlFor="list-name-input" error={errors.title?.message}>
          <input
            id="list-name-input"
            type="text"
            placeholder="e.g. Office Move"
            className={inputClass}
            autoFocus
            {...register("title")}
          />
        </Field>
        <div className="mt-6 flex justify-end gap-[0.6rem]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isRename ? "Save" : "Create list"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
