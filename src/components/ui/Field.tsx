import { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-[0.4rem]">
      <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-xs text-ink-faint">{hint}</span>}
      {error && <span className="text-xs font-semibold text-danger">{error}</span>}
    </div>
  );
}
