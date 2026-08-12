"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { memberSchema, MemberFormValues } from "@/lib/validation/schemas";
import { addMember } from "@/lib/firestore/lists";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface-sunk px-[0.9rem] py-3 text-base text-ink placeholder:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  listId: string;
}

export function AddMemberModal({ open, onClose, listId }: AddMemberModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({ resolver: zodResolver(memberSchema), defaultValues: { role: "admin" } });

  useEffect(() => {
    if (open) reset({ email: "", role: "admin" });
  }, [open, reset]);

  async function onSubmit(values: MemberFormValues) {
    try {
      await addMember(listId, values.email, values.role);
      toast.success("Invite sent");
      reset({ email: "", role: "admin" });
      onClose();
    } catch (err) {
      if (err instanceof Error && err.message === "user-not-found") {
        toast.error("No account found with that email");
      } else {
        toast.error("Something went wrong, try again");
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite a member">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex gap-[0.6rem]">
          <div className="flex-[2]">
            <Field label="Email address" htmlFor="member-email-input" error={errors.email?.message}>
              <input id="member-email-input" type="email" placeholder="name@company.com" className={inputClass} {...register("email")} />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Role" htmlFor="member-role-input">
              <select id="member-role-input" className={inputClass} {...register("role")}>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </Field>
          </div>
        </div>
        <p className="text-xs text-ink-faint">
          They need an existing account with this email — we&apos;ll show an error if none is found.
        </p>
        <div className="mt-2 flex justify-end gap-[0.6rem]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
