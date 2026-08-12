"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/ui/icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(42,33,24,0.42)] p-0 sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full animate-riseIn rounded-t-[20px] bg-surface p-5 pb-8 shadow-pop sm:max-w-[440px] sm:rounded-card sm:p-7 sm:pb-7">
        <div className="mb-[1.1rem] flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
            <CloseIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
