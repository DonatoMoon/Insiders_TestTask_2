import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "accent" | "ghost" | "danger";
  size?: "sm" | "md";
  block?: boolean;
}

export function Button({
  variant = "accent",
  size = "md",
  block = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-bold leading-none transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        size === "md" ? "px-[1.15rem] py-[0.7rem] text-sm" : "px-[0.85rem] py-[0.5rem] text-xs",
        block && "w-full",
        variant === "accent" && "bg-accent text-white hover:bg-accent-text",
        variant === "ghost" && "bg-surface border border-line-strong text-ink hover:border-ink-faint",
        variant === "danger" && "bg-danger text-white hover:bg-[#832612]",
        className
      )}
      {...props}
    />
  );
}
