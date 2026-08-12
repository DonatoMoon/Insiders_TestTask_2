"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, RegisterFormValues } from "@/lib/validation/schemas";
import { registerUser } from "@/lib/auth/authService";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface-sunk px-[0.9rem] py-3 text-base text-ink placeholder:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

// Firebase Auth error strings ("Firebase: Error (auth/email-already-in-use).")
// are not user-facing copy, so map the codes we can act on to friendly text.
// Read `code` structurally rather than via `instanceof FirebaseError`:
// firebase/auth ships its own copy of that class, so the identity check
// against firebase/app's export can't be relied on.
function errorCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err && typeof err.code === "string") {
    return err.code;
  }
  return null;
}

function registerErrorMessage(err: unknown): string {
  switch (errorCode(err)) {
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/weak-password":
      return "Password is too weak";
    default:
      return "Could not create account";
  }
}

export function RegisterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setSubmitting(true);
    try {
      await registerUser(values.name, values.email, values.password);
      toast.success("Account created");
      router.push("/lists");
    } catch (err) {
      toast.error(registerErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-[380px] flex-col gap-[1.1rem]">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-ink-soft">Takes less than a minute.</p>
      </div>
      <Field label="Name" htmlFor="reg-name" error={errors.name?.message}>
        <input id="reg-name" type="text" placeholder="Olivia Bennett" className={inputClass} {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="reg-email" error={errors.email?.message}>
        <input id="reg-email" type="email" placeholder="name@company.com" className={inputClass} {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="reg-password" error={errors.password?.message} hint="At least 8 characters.">
        <input id="reg-password" type="password" placeholder="••••••••" className={inputClass} {...register("password")} />
      </Field>
      <Button type="submit" block disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-accent-text">
          Sign in
        </Link>
      </p>
    </form>
  );
}
