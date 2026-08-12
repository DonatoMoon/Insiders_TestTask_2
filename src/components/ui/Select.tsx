"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "@/components/ui/icons";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

export function Select({ value, onChange, options, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex w-full items-center justify-between gap-3 text-left outline-none transition-colors",
          className,
          open && "border-accent ring-2 ring-accent ring-opacity-20"
        )}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDownIcon className={clsx("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[120%] flex-col gap-1 rounded-lg border border-line bg-surface p-[0.35rem] shadow-lift">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={clsx(
                "block w-full rounded-md px-[0.65rem] py-2 text-left text-sm hover:bg-surface-sunk whitespace-nowrap",
                value === option.value ? "font-bold text-accent-text" : "font-medium text-ink"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
