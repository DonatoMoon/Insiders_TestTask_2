"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, LoginFormValues } from "@/lib/validation/schemas";
import { loginUser } from "@/lib/auth/authService";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface-sunk px-[0.9rem] py-3 text-base text-ink placeholder:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

export function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    try {
      await loginUser(values.email, values.password);
      router.push("/lists");
    } catch {
      toast.error("Incorrect email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-[380px] flex-col gap-[1.1rem]">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-soft">Sign in to see what&apos;s on your lists today.</p>
      </div>
      <Field label="Email" htmlFor="login-email" error={errors.email?.message}>
        <input id="login-email" type="email" placeholder="name@company.com" className={inputClass} {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="login-password" error={errors.password?.message}>
        <input id="login-password" type="password" placeholder="••••••••" className={inputClass} {...register("password")} />
      </Field>
      <Button type="submit" block disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/register" className="font-bold text-accent-text">
          Create an account
        </Link>
      </p>
    </form>
  );
}
