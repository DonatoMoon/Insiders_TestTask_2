"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WarningIcon } from "@/components/ui/icons";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = "Delete" }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WarningIcon className="h-7 w-7" />
      </div>
      <p className="text-center text-sm text-ink-soft">{body}</p>
      <div className="mt-7 flex justify-end gap-[0.6rem]">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
