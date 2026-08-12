# To-Do App (Together) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js + Firebase To-Do app where users create shared task lists and add collaborators by email with Owner/Admin/Viewer roles, per `docs/superpowers/specs/2026-08-12-todo-app-design.md`.

**Architecture:** Next.js App Router (TS) + Tailwind, Firebase Auth (email/password) + Firestore with realtime `onSnapshot` subscriptions, Firestore Security Rules as the source of truth for role permissions (UI only mirrors them). Zustand holds auth/UI state only — server data lives in Firestore, read via custom hooks. react-hook-form + zod for all forms. `sonner` for toasts.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Firebase (`firebase` JS SDK v9+, Auth + Firestore), Zustand, react-hook-form, zod, sonner.

## Global Constraints

- Stack floor is mandatory per ТЗ: Next.js + TypeScript + Tailwind + Firebase (Auth + Firestore). No swapping any of these.
- No 3rd-party UI component kit and no CSS framework beyond Tailwind — primitives (`Button`, `Field`, `Modal`, `ConfirmDialog`) are hand-built, matching `docs/superpowers/specs/2026-08-12-todo-app-design.md` §5.
- No 3rd-party icon library — icons are small local inline-SVG components (`src/components/ui/icons.tsx`), same paths as the approved design preview.
- State: Zustand for auth/UI state only. Never put Firestore data in Zustand — components read it via the `useLists` / `useListDetail` / `useTasks` hooks, which wrap `onSnapshot`. No React Query, no manual refetch layer.
- Forms: react-hook-form + `@hookform/resolvers/zod` + schemas from `src/lib/validation/schemas.ts`. Every form in this plan uses this combo — no ad-hoc `useState` forms.
- Toasts: `sonner`. `<Toaster />` is mounted once in the root layout (Task 4). Every mutating action (create/update/delete/invite) calls `toast.success(...)` or `toast.error(...)` inline where it happens — there is no separate "add toasts" task.
- Firestore Security Rules enforce the permission matrix from the design spec; the client UI hides/disables controls for roles that can't use them, but rules are what actually blocks it. Never trust client-side role checks alone.
- **NO TESTS.** This is an explicit, user-approved deviation from this skill's default TDD task template (recorded in `2026-08-12-todo-app-discovery-log.md` §6 — "Без тестів, фокус на фічі"). Every task below replaces the usual "write failing test → verify fail → implement → verify pass" cycle with: implement → `npx tsc --noEmit` (and `npm run build` where noted) → a precise manual browser-verification script with exact steps and exact expected results → commit. Do not add a test runner or test files unless the user asks.
- UI language is English only (all copy, labels, error messages).
- Package manager: npm.
- Timestamps (`createdAt`/`updatedAt`) are plain `number` (`Date.now()`), written directly by the client — not Firestore `serverTimestamp()`. This is a deliberate simplification (avoids `Timestamp`/`number` conversion boilerplate across every file) appropriate for this app's scale; do not "fix" it into `serverTimestamp()` mid-plan, it would break the type everywhere.
- Two dashboard "nice-to-have" items visible in the design preview are deliberately trimmed in the real build because they'd require expensive cross-list aggregation for decorative-only value: no "10 open tasks" aggregate stat (dashboard shows only `lists.length` and shared-count, both free from data already loaded), and no "Sort: Progress" option (only "Recently updated" and "Name (A–Z)", both plain fields on the list doc). Do not re-add these without discussing the cost with the user first.

---

## Task 1: Project scaffold, Tailwind design tokens, fonts

**Files:**
- Create: whole Next.js project at repo root (`D:\Web\test\Insiders2`) via `create-next-app`
- Create: `tailwind.config.ts`
- Create: `src/lib/fonts.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx` (temporary font/color smoke-check — replaced for real in Task 6)

**Interfaces:**
- Produces: `unbounded`, `golosText`, `caveat` (Next `NextFontWithVariable` objects) exported from `src/lib/fonts.ts`, each with a `.variable` class name (`--font-unbounded`, `--font-golos`, `--font-caveat`) — every later task that needs the font stack imports these three names.
- Produces: Tailwind theme tokens `bg`, `surface`, `surface-sunk`, `ink`, `ink-soft`, `ink-faint`, `line`, `line-strong`, `accent`/`accent-text`/`accent-soft`, `gold`/`gold-text`/`gold-soft`, `sage`/`sage-text`/`sage-soft`, `danger`/`danger-soft`, font families `font-display`/`font-body`/`font-hand`, shadows `shadow-rest`/`shadow-lift`/`shadow-pop`, `animate-riseIn` — every later task's Tailwind classes assume these exist.

- [ ] **Step 1: Scaffold the Next.js project**

Run from `D:\Web\test\Insiders2` (already contains `ТЗ.txt` and `docs/` — scaffolding into the same directory is fine, `create-next-app` only refuses on a non-empty dir if you don't pass `--yes`/confirm):

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint --no-turbopack
```

If prompted about the non-empty directory, confirm yes (only `ТЗ.txt` and `docs/` exist, nothing will be overwritten).

- [ ] **Step 2: Install dependencies**

```bash
npm install firebase zustand react-hook-form @hookform/resolvers zod sonner clsx
```

- [ ] **Step 3: Write `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAF8F4",
        surface: "#FFFFFF",
        "surface-sunk": "#F1ECE3",
        ink: "#2A2118",
        "ink-soft": "#6B6153",
        "ink-faint": "#A89D8C",
        line: "#E6DFD2",
        "line-strong": "#D8CEBC",
        accent: { DEFAULT: "#C1502E", text: "#9C4020", soft: "#F3DCCF" },
        gold: { DEFAULT: "#B8873A", text: "#8C6626", soft: "#F0E3C8" },
        sage: { DEFAULT: "#6E7F5C", text: "#52604A", soft: "#E1E8D7" },
        danger: { DEFAULT: "#A3311A", soft: "#F6DCD3" },
      },
      fontFamily: {
        display: ["var(--font-unbounded)", "system-ui", "sans-serif"],
        body: ["var(--font-golos)", "system-ui", "sans-serif"],
        hand: ["var(--font-caveat)", "cursive"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        rest: "0 1px 2px rgba(42,33,24,0.06), 0 1px 1px rgba(42,33,24,0.04)",
        lift: "0 18px 34px rgba(42,33,24,0.14), 0 6px 12px rgba(42,33,24,0.08)",
        pop: "0 24px 60px rgba(42,33,24,0.22), 0 8px 20px rgba(42,33,24,0.12)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        riseIn: "riseIn 0.55s cubic-bezier(0.2,0.7,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Write `src/lib/fonts.ts`**

```ts
import { Unbounded, Golos_Text, Caveat } from "next/font/google";

export const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-unbounded",
});

export const golosText = Golos_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-golos",
});

export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
});
```

If `next/font/google` fails to resolve `Unbounded` or `Golos_Text` (Next version metadata lag), self-host instead: download the two woff2 URLs already verified during design research (`https://fonts.gstatic.com/s/unbounded/v12/Yq6W-LOTXCb04q32xlpwu8Zf.woff2` and `https://fonts.gstatic.com/s/golostext/v7/q5uCsoe9Lv5t7Meb31EcExN8hA.woff2`, plus Caveat's `https://fonts.gstatic.com/s/caveat/v23/Wnz6HAc5bAfYB2Q7ZjYY.woff2`) into `src/assets/fonts/`, and replace the `next/font/google` calls with `next/font/local` pointing at those files, keeping the same three export names and `variable` values.

- [ ] **Step 5: Replace `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  -webkit-text-size-adjust: 100%;
}

body {
  background: theme("colors.bg");
  color: theme("colors.ink");
}
```

- [ ] **Step 6: Wire fonts into `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { unbounded, golosText, caveat } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Together",
  description: "Shared to-do lists, together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${golosText.variable} ${caveat.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Temporary smoke-check page — `src/app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
      <h1 className="font-display font-extrabold text-4xl text-ink">Together</h1>
      <p className="font-hand text-2xl text-accent-text -rotate-1">shared to-do lists, together</p>
      <p className="font-body text-ink-soft">scaffold OK — replaced by real redirect logic in Task 6</p>
    </main>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: page shows "Together" in the blocky Unbounded display font, the handwritten tagline in Caveat below it in a rotated accent-orange, warm off-white background — not the default Next.js starter page, and no font-loading errors in the browser console or terminal.

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind design tokens and fonts"
```

---

## Task 2: Firebase project, client SDK, Firestore security rules

**Files:**
- Create: `src/lib/firebase/client.ts`
- Create: `.env.local` (not committed) and `.env.local.example` (committed)
- Create: `firestore.rules`
- Create: `firebase.json`
- Create: `firestore.indexes.json`
- Modify: `.gitignore` (ensure `.env.local` is ignored — `create-next-app` already ignores `.env*.local` by default, verify it's there)

**Interfaces:**
- Produces: `app`, `auth`, `db` exported from `src/lib/firebase/client.ts` — every Firestore/Auth call in later tasks imports `auth`/`db` from here.

- [ ] **Step 1: Create the Firebase project (manual, Firebase console)**

This step needs the user's Firebase account — do it together, not something to script blindly:

1. Go to the Firebase console, create a new project (any name, e.g. "together-todo").
2. Build → Authentication → Get started → enable the **Email/Password** sign-in provider.
3. Build → Firestore Database → Create database → start in **production mode** (rules from Step 3 below will lock it down properly) → pick a region.
4. Project settings → General → "Your apps" → add a **Web app** → copy the resulting `firebaseConfig` object.

- [ ] **Step 2: Write `.env.local.example` and `.env.local`**

`.env.local.example` (committed, placeholder values):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

`.env.local` (gitignored, real values from Step 1's `firebaseConfig`) — fill in the six `NEXT_PUBLIC_FIREBASE_*` values from the copied config.

- [ ] **Step 3: Write `src/lib/firebase/client.ts`**

```ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

- [ ] **Step 4: Write `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    match /users/{uid} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == uid;
      allow update: if isSignedIn() && request.auth.uid == uid;
      allow delete: if false;
    }

    match /lists/{listId} {
      function isMember() {
        return isSignedIn() && request.auth.uid in resource.data.members;
      }
      function isOwner() {
        return isSignedIn() && resource.data.members[request.auth.uid] == 'owner';
      }

      allow read: if isMember();
      allow create: if isSignedIn()
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.members[request.auth.uid] == 'owner';
      allow update: if isOwner();
      allow delete: if isOwner();

      match /tasks/{taskId} {
        function parentList() {
          return get(/databases/$(database)/documents/lists/$(listId)).data;
        }
        function parentRole() {
          return parentList().members[request.auth.uid];
        }
        function isParentMember() {
          return isSignedIn() && request.auth.uid in parentList().members;
        }
        function isParentEditor() {
          return isSignedIn() && (parentRole() == 'owner' || parentRole() == 'admin');
        }

        allow read: if isParentMember();
        allow create: if isParentEditor();
        allow delete: if isParentEditor();
        allow update: if isParentEditor() || (
          isParentMember() && parentRole() == 'viewer' &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['completed', 'updatedAt'])
        );
      }
    }
  }
}
```

- [ ] **Step 5: Write `firebase.json`**

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

- [ ] **Step 6: Write `firestore.indexes.json`**

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

- [ ] **Step 7: Verify `.gitignore`**

Open `.gitignore` (created by `create-next-app`), confirm it contains a line matching `.env*.local` (it does by default). Do not commit `.env.local`.

- [ ] **Step 8: Verify**

Run: `npm run dev`.
Expected: dev server starts with no thrown Firebase initialization error in the terminal or browser console (the smoke-check page from Task 1 still renders — Firebase isn't used by any UI yet, this only confirms `initializeApp` doesn't throw on the real config).

Run: `npx tsc --noEmit`.
Expected: no type errors.

- [ ] **Step 9: Commit**

```bash
git add firestore.rules firebase.json firestore.indexes.json .env.local.example src/lib/firebase/client.ts .gitignore
git commit -m "chore: add Firebase client SDK init and Firestore security rules"
```

(`.env.local` is intentionally not staged — it's gitignored.)

---

## Task 3: Core types and zod validation schemas

**Files:**
- Create: `src/lib/types/index.ts`
- Create: `src/lib/validation/schemas.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: types `Role`, `UserProfile`, `TodoList`, `Task` — every later task's Firestore/UI code imports these from `@/lib/types`. Produces zod schemas `registerSchema`, `loginSchema`, `listSchema`, `taskSchema`, `memberSchema` and their inferred value types (`RegisterFormValues`, `LoginFormValues`, `ListFormValues`, `TaskFormValues`, `MemberFormValues`) from `@/lib/validation/schemas` — every form task imports the matching pair.

- [ ] **Step 1: Write `src/lib/types/index.ts`**

```ts
export type Role = "owner" | "admin" | "viewer";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface TodoList {
  id: string;
  title: string;
  ownerId: string;
  members: Record<string, Role>;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 2: Write `src/lib/validation/schemas.ts`**

```ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Must be at least 8 characters"),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const listSchema = z.object({
  title: z.string().min(1, "Give the list a name").max(80, "Keep it under 80 characters"),
});
export type ListFormValues = z.infer<typeof listSchema>;

export const taskSchema = z.object({
  title: z.string().min(1, "Give the task a title").max(120, "Keep it under 120 characters"),
  description: z.string().max(500, "Keep it under 500 characters").optional().default(""),
});
export type TaskFormValues = z.infer<typeof taskSchema>;

export const memberSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["admin", "viewer"]),
});
export type MemberFormValues = z.infer<typeof memberSchema>;
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types src/lib/validation
git commit -m "feat: add core domain types and zod validation schemas"
```

---

## Task 4: Auth state (Zustand store + provider + hook), root layout wiring

**Files:**
- Create: `src/store/authStore.ts`
- Create: `src/components/providers/AuthProvider.tsx`
- Create: `src/hooks/useAuth.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `auth` from `@/lib/firebase/client` (Task 2).
- Produces: `useAuthStore` (Zustand store) from `@/store/authStore` with shape `{ user: User | null; initializing: boolean; setUser: (u: User | null) => void; setInitializing: (v: boolean) => void }` (`User` is `firebase/auth`'s type). Produces `AuthProvider` component from `@/components/providers/AuthProvider`. Produces `useAuth()` from `@/hooks/useAuth` returning `{ user: User | null; initializing: boolean }` — every later task that needs "who's logged in" calls this hook, never `useAuthStore` directly.

- [ ] **Step 1: Write `src/store/authStore.ts`**

```ts
import { create } from "zustand";
import type { User } from "firebase/auth";

interface AuthState {
  user: User | null;
  initializing: boolean;
  setUser: (user: User | null) => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  setUser: (user) => set({ user }),
  setInitializing: (value) => set({ initializing: value }),
}));
```

- [ ] **Step 2: Write `src/components/providers/AuthProvider.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuthStore } from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
    });
    return unsubscribe;
  }, [setUser, setInitializing]);

  return <>{children}</>;
}
```

- [ ] **Step 3: Write `src/hooks/useAuth.ts`**

```ts
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);
  return { user, initializing };
}
```

- [ ] **Step 4: Wire `AuthProvider` and `Toaster` into `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { unbounded, golosText, caveat } from "@/lib/fonts";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Together",
  description: "Shared to-do lists, together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${golosText.variable} ${caveat.variable}`}>
      <body className="font-body">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#2A2118",
                color: "#FAF8F4",
                border: "none",
                borderRadius: "11px",
                fontFamily: "var(--font-golos)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`, open `http://localhost:3000`.
Expected: same smoke-check page as Task 1 renders, no console errors — confirms `AuthProvider`'s `onAuthStateChanged` subscription mounts cleanly with no signed-in user yet.

- [ ] **Step 6: Commit**

```bash
git add src/store src/components/providers src/hooks/useAuth.ts src/app/layout.tsx
git commit -m "feat: add Zustand auth store, AuthProvider, and useAuth hook"
```

---

## Task 5: Register flow (Button/Field primitives, users.ts, authService, RegisterForm, register page)

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Field.tsx`
- Create: `src/lib/firestore/users.ts`
- Create: `src/lib/auth/authService.ts`
- Create: `src/components/auth/RegisterForm.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: `auth`, `db` (Task 2); `UserProfile` type (Task 3); `registerSchema`/`RegisterFormValues` (Task 3).
- Produces: `Button` from `@/components/ui/Button` — props `{ variant?: "accent" | "ghost" | "danger"; size?: "sm" | "md"; block?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>`. Produces `Field` from `@/components/ui/Field` — props `{ label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode }`. Both are used by every form built in later tasks.
- Produces: `createUserProfile(uid: string, email: string, name: string): Promise<void>` and `findUserByEmail(email: string): Promise<UserProfile | null>` from `@/lib/firestore/users` — `findUserByEmail` is consumed by Task 7's `addMember`.
- Produces: `registerUser(name: string, email: string, password: string): Promise<void>`, `loginUser(email: string, password: string): Promise<void>`, `logoutUser(): Promise<void>` from `@/lib/auth/authService` — `loginUser`/`logoutUser` are consumed by Task 6.

- [ ] **Step 1: Write `src/components/ui/Button.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `src/components/ui/Field.tsx`**

```tsx
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
```

`Field` renders whatever input element is passed as `children` — the input itself carries its own Tailwind classes (kept on the input rather than baked into `Field`, since some inputs need `type="password"` vs `type="email"` vs `<textarea>` vs `<select>`). Standard input classes used throughout this plan: `"w-full rounded-lg border border-line-strong bg-surface-sunk px-[0.9rem] py-3 text-base text-ink placeholder:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"` — reuse this literal string on every `<input>`/`<textarea>`/`<select>` in later tasks so they look consistent (there's no separate `Input` component; the class string is the contract).

- [ ] **Step 3: Write `src/lib/firestore/users.ts`**

```ts
import { collection, doc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";

export async function createUserProfile(uid: string, email: string, name: string): Promise<void> {
  const profile: UserProfile = { uid, email, name, createdAt: Date.now() };
  await setDoc(doc(db, "users", uid), profile);
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const q = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as UserProfile;
}
```

- [ ] **Step 4: Write `src/lib/auth/authService.ts`**

```ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firestore/users";

export async function registerUser(name: string, email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await createUserProfile(credential.user.uid, email, name);
}

export async function loginUser(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
```

- [ ] **Step 5: Write `src/components/auth/RegisterForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, RegisterFormValues } from "@/lib/validation/schemas";
import { registerUser } from "@/lib/auth/authService";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface-sunk px-[0.9rem] py-3 text-base text-ink placeholder:text-ink-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

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
      const message = err instanceof Error ? err.message : "Could not create account";
      toast.error(message);
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
        <a href="/login" className="font-bold text-accent-text">
          Sign in
        </a>
      </p>
    </form>
  );
}
```

- [ ] **Step 6: Write `src/app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">{children}</div>;
}
```

- [ ] **Step 7: Write `src/app/(auth)/register/page.tsx`**

```tsx
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`, open `http://localhost:3000/register`.
- Submit the empty form → expect "Give the list a name"-style inline errors under Name/Email/Password (exact zod messages from Task 3).
- Fill Name "Olivia Bennett", Email `olivia@example.com`, Password "test1234", submit.
Expected: a "Account created" toast appears bottom-right, the browser navigates to `/lists` (will 404 until Task 6 — that 404 is expected right now). In the Firebase console: Authentication → Users shows the new user; Firestore → `users` collection has a doc keyed by that user's uid with `{ uid, email: "olivia@example.com", name: "Olivia Bennett", createdAt }`.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/Field.tsx src/lib/firestore/users.ts src/lib/auth/authService.ts src/components/auth/RegisterForm.tsx "src/app/(auth)"
git commit -m "feat: add register flow with Button/Field primitives and users data layer"
```

---

## Task 6: Login, auth guard, icon set, app shell, root redirect

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/components/ui/icons.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/lists/page.tsx` (placeholder — replaced with real dashboard in Task 9)
- Create: `src/app/page.tsx` (replaces Task 1's smoke-check page)

**Interfaces:**
- Consumes: `loginUser`, `logoutUser` (Task 5); `useAuth` (Task 4).
- Produces: icon components `CheckIcon`, `PlusIcon`, `PencilIcon`, `TrashIcon`, `KeyIcon`, `WrenchIcon`, `EyeIcon`, `ChevronDownIcon`, `ChevronLeftIcon`, `CloseIcon`, `WarningIcon`, `SearchIcon`, `KebabIcon` from `@/components/ui/icons`, each `(props: React.SVGProps<SVGSVGElement>) => JSX.Element` — consumed across Tasks 8, 9, 11, 12, 13. Not every icon is used yet; that's expected, they're all defined here once so later tasks just import.

- [ ] **Step 1: Write `src/components/auth/LoginForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, LoginFormValues } from "@/lib/validation/schemas";
import { loginUser } from "@/lib/auth/authService";
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
    } catch (err) {
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
        <a href="/register" className="font-bold text-accent-text">
          Create an account
        </a>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/app/(auth)/login/page.tsx`**

```tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 3: Write `src/components/ui/icons.tsx`**

```tsx
import { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.4} {...props}>
      <path d="M4 12.5l4.5 4.5L19 6" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </svg>
  );
}

export function KeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l3 3M14 9l2.5 2.5" />
    </svg>
  );
}

export function WrenchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.6 5.1L4 16.5V20h3.5l5.1-5.1a4 4 0 0 0 5.1-5.6l-2.8 2.8-2-2 2.8-2.8z" />
    </svg>
  );
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function WarningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 9v5M12 17h.01" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function KebabIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}
```

- [ ] **Step 4: Write the auth guard — `src/app/(app)/layout.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !user) {
      router.replace("/login");
    }
  }, [initializing, user, router]);

  if (initializing || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="font-body text-ink-soft">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 5: Write the placeholder dashboard — `src/app/(app)/lists/page.tsx`**

```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/lib/auth/authService";
import { Button } from "@/components/ui/Button";

export default function ListsPage() {
  const { user } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <p className="font-display text-2xl text-ink">Welcome, {user?.displayName ?? user?.email}</p>
      <p className="text-ink-soft">Dashboard placeholder — replaced with the real thing in Task 9.</p>
      <Button variant="ghost" onClick={() => logoutUser()}>
        Sign out
      </Button>
    </main>
  );
}
```

- [ ] **Step 6: Write the root redirect — `src/app/page.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    router.replace(user ? "/lists" : "/login");
  }, [user, initializing, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="font-body text-ink-soft">Loading…</p>
    </div>
  );
}
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`.
- Open `http://localhost:3000` while signed out (or after clicking "Sign out" if the browser still holds Task 5's session) → expect redirect to `/login`.
- Sign in with the `olivia@example.com` / `test1234` account created in Task 5 → expect redirect to `/lists`, showing "Welcome, Olivia Bennett" and a working "Sign out" button.
- Click "Sign out" → expect redirect back to `/login`.
- While signed out, manually navigate to `http://localhost:3000/lists` → expect redirect to `/login` (auth guard working).

- [ ] **Step 8: Commit**

```bash
git add src/components/auth/LoginForm.tsx "src/app/(auth)/login" src/components/ui/icons.tsx "src/app/(app)" src/app/page.tsx
git commit -m "feat: add login flow, auth guard, icon set, and root redirect"
```

---

## Task 7: Lists data layer (`lib/firestore/lists.ts`, `useLists`, `useListDetail`)

**Files:**
- Create: `src/lib/firestore/lists.ts`
- Create: `src/hooks/useLists.ts`
- Create: `src/hooks/useListDetail.ts`
- Modify: `src/app/(app)/lists/page.tsx` (temporary debug button — replaced for real in Task 9)

**Interfaces:**
- Consumes: `db` (Task 2); `TodoList`, `Role` (Task 3); `findUserByEmail` (Task 5).
- Produces: `subscribeToMyLists(uid, cb): Unsubscribe`, `createList(title, ownerId): Promise<string>`, `renameList(listId, title): Promise<void>`, `deleteList(listId): Promise<void>`, `addMember(listId, email, role): Promise<void>` (rejects with `Error("user-not-found")` if no matching profile), `removeMember(listId, uid): Promise<void>`, `subscribeToList(listId, cb): Unsubscribe` from `@/lib/firestore/lists`.
- Produces: `useLists(): { lists: TodoList[]; loading: boolean }` from `@/hooks/useLists` — consumed by Task 9.
- Produces: `useListDetail(listId: string): { list: TodoList | null; role: Role | null; loading: boolean }` from `@/hooks/useListDetail` — consumed by Task 11.

- [ ] **Step 1: Write `src/lib/firestore/lists.ts`**

```ts
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentData,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Role, TodoList } from "@/lib/types";
import { findUserByEmail } from "@/lib/firestore/users";

function toTodoList(id: string, data: DocumentData): TodoList {
  return {
    id,
    title: data.title,
    ownerId: data.ownerId,
    members: data.members,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function subscribeToMyLists(uid: string, callback: (lists: TodoList[]) => void): Unsubscribe {
  const q = query(collection(db, "lists"), where(`members.${uid}`, "!=", null));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toTodoList(d.id, d.data())));
  });
}

export function subscribeToList(listId: string, callback: (list: TodoList | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "lists", listId), (snapshot) => {
    callback(snapshot.exists() ? toTodoList(snapshot.id, snapshot.data()) : null);
  });
}

export async function createList(title: string, ownerId: string): Promise<string> {
  const ref = doc(collection(db, "lists"));
  const now = Date.now();
  await setDoc(ref, {
    title,
    ownerId,
    members: { [ownerId]: "owner" as Role },
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function renameList(listId: string, title: string): Promise<void> {
  await updateDoc(doc(db, "lists", listId), { title, updatedAt: Date.now() });
}

export async function deleteList(listId: string): Promise<void> {
  await deleteDoc(doc(db, "lists", listId));
}

export async function addMember(listId: string, email: string, role: Exclude<Role, "owner">): Promise<void> {
  const profile = await findUserByEmail(email);
  if (!profile) {
    throw new Error("user-not-found");
  }
  await updateDoc(doc(db, "lists", listId), {
    [`members.${profile.uid}`]: role,
    updatedAt: Date.now(),
  });
}

export async function removeMember(listId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "lists", listId), {
    [`members.${uid}`]: deleteField(),
    updatedAt: Date.now(),
  });
}
```

- [ ] **Step 2: Write `src/hooks/useLists.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToMyLists } from "@/lib/firestore/lists";
import type { TodoList } from "@/lib/types";

export function useLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToMyLists(user.uid, (result) => {
      setLists(result);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { lists, loading };
}
```

- [ ] **Step 3: Write `src/hooks/useListDetail.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToList } from "@/lib/firestore/lists";
import type { Role, TodoList } from "@/lib/types";

export function useListDetail(listId: string) {
  const { user } = useAuth();
  const [list, setList] = useState<TodoList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToList(listId, (result) => {
      setList(result);
      setLoading(false);
    });
    return unsubscribe;
  }, [listId]);

  const role: Role | null = user && list ? list.members[user.uid] ?? null : null;

  return { list, role, loading };
}
```

- [ ] **Step 4: Temporarily wire `createList` into the placeholder dashboard to prove the data layer end-to-end**

Modify `src/app/(app)/lists/page.tsx`, adding a debug button (Task 9 deletes this button and replaces the whole file with the real dashboard):

```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import { logoutUser } from "@/lib/auth/authService";
import { createList } from "@/lib/firestore/lists";
import { Button } from "@/components/ui/Button";

export default function ListsPage() {
  const { user } = useAuth();
  const { lists, loading } = useLists();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <p className="font-display text-2xl text-ink">Welcome, {user?.displayName ?? user?.email}</p>
      <p className="text-ink-soft">Dashboard placeholder — replaced with the real thing in Task 9.</p>
      <p className="text-ink-soft">{loading ? "Loading lists…" : `${lists.length} list(s): ${lists.map((l) => l.title).join(", ")}`}</p>
      <Button onClick={() => user && createList("Office Move", user.uid)}>DEBUG: create test list</Button>
      <Button variant="ghost" onClick={() => logoutUser()}>
        Sign out
      </Button>
    </main>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`, sign in as `olivia@example.com`.
- Click "DEBUG: create test list" once.
Expected: the page text updates to show "1 list(s): Office Move" without a manual refresh (proves the `onSnapshot` subscription in `useLists` is live). In the Firestore console, `lists` now has one doc with `title: "Office Move"`, `ownerId` equal to Olivia's uid, and `members: { "<uid>": "owner" }`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/firestore/lists.ts src/hooks/useLists.ts src/hooks/useListDetail.ts src/app/(app)/lists/page.tsx
git commit -m "feat: add lists Firestore data layer with realtime hooks"
```

---

## Task 8: Modal + ConfirmDialog primitives, CreateListModal, wire "New list" into dashboard

**Files:**
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/ui/ConfirmDialog.tsx`
- Create: `src/components/lists/CreateListModal.tsx`
- Modify: `src/app/(app)/lists/page.tsx` (replace the Task 7 debug button with the real modal-driven flow)

**Interfaces:**
- Consumes: `Button`, `Field` (Task 5); `CloseIcon`, `WarningIcon` (Task 6); `createList`, `renameList`, `deleteList` (Task 7); `listSchema`/`ListFormValues` (Task 3).
- Produces: `Modal` from `@/components/ui/Modal` — props `{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }`. Produces `ConfirmDialog` from `@/components/ui/ConfirmDialog` — props `{ open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirmLabel?: string }` — both consumed by Tasks 9, 11, 12, 13.
- Produces: `CreateListModal` from `@/components/lists/CreateListModal` — props `{ open: boolean; onClose: () => void; ownerId: string; initial?: { id: string; title: string } }` (passing `initial` switches it into rename mode) — consumed by Tasks 9 and 11.

- [ ] **Step 1: Write `src/components/ui/Modal.tsx`**

```tsx
"use client";

import { ReactNode, useEffect } from "react";
import { CloseIcon } from "@/components/ui/icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(42,33,24,0.42)] p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] animate-riseIn rounded-card bg-surface p-7 shadow-pop">
        <div className="mb-[1.1rem] flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
            <CloseIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/ui/ConfirmDialog.tsx`**

```tsx
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
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WarningIcon className="h-[22px] w-[22px]" />
      </div>
      <p className="text-sm text-ink-soft">{body}</p>
      <div className="mt-6 flex justify-end gap-[0.6rem]">
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
```

Note: `Modal`'s own `title` prop is reused as the confirm dialog's heading, so `ConfirmDialog` doesn't duplicate a heading element.

- [ ] **Step 3: Write `src/components/lists/CreateListModal.tsx`**

```tsx
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
```

- [ ] **Step 4: Replace the debug button in `src/app/(app)/lists/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import { logoutUser } from "@/lib/auth/authService";
import { CreateListModal } from "@/components/lists/CreateListModal";
import { Button } from "@/components/ui/Button";

export default function ListsPage() {
  const { user } = useAuth();
  const { lists, loading } = useLists();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <p className="font-display text-2xl text-ink">Welcome, {user?.displayName ?? user?.email}</p>
      <p className="text-ink-soft">Dashboard placeholder — replaced with the real thing in Task 9.</p>
      <p className="text-ink-soft">{loading ? "Loading lists…" : `${lists.length} list(s): ${lists.map((l) => l.title).join(", ")}`}</p>
      <Button onClick={() => setCreateOpen(true)}>New list</Button>
      <Button variant="ghost" onClick={() => logoutUser()}>
        Sign out
      </Button>
      {user && <CreateListModal open={createOpen} onClose={() => setCreateOpen(false)} ownerId={user.uid} />}
    </main>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`, sign in as Olivia.
- Click "New list" → modal opens with an empty, autofocused "List name" input.
- Submit empty → expect the "Give the list a name" inline error, modal stays open.
- Type "Weekend Trip", submit → expect a "List created" toast, modal closes, and the list count text updates live to include "Weekend Trip" alongside any list from Task 7's debug run.
- Press Escape while a modal is open → expect it to close. Click the backdrop outside the modal panel → expect it to close too.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Modal.tsx src/components/ui/ConfirmDialog.tsx src/components/lists/CreateListModal.tsx src/app/(app)/lists/page.tsx
git commit -m "feat: add Modal/ConfirmDialog primitives and wire create-list flow"
```

---

## Task 9: Full dashboard UI (ListCard, grouping, search/sort, kebab menu)

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/components/lists/ListCard.tsx`
- Modify: `src/app/(app)/lists/page.tsx` (full rewrite, replaces the placeholder)

**Interfaces:**
- Consumes: `useAuth` (Task 4); `useLists` (Task 7); `deleteList` (Task 7); `CreateListModal`, `ConfirmDialog` (Task 8); `KeyIcon`, `WrenchIcon`, `EyeIcon`, `KebabIcon`, `PlusIcon`, `SearchIcon` (Task 6); `TodoList`, `Role` (Task 3).
- Produces: `formatRelativeTime(timestamp: number): string` from `@/lib/format` — used by `ListCard` here and reusable later if needed.
- Produces: `ListCard` from `@/components/lists/ListCard` — props `{ list: TodoList; role: Role; onRename: () => void; onDelete: () => void }`.

- [ ] **Step 1: Write `src/lib/format.ts`**

```ts
export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}
```

- [ ] **Step 2: Write `src/components/lists/ListCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";
import { KeyIcon, WrenchIcon, EyeIcon, KebabIcon } from "@/components/ui/icons";
import type { Role, TodoList } from "@/lib/types";

const roleMeta: Record<Role, { label: string; icon: typeof KeyIcon; classes: string }> = {
  owner: { label: "owner", icon: KeyIcon, classes: "text-accent-text bg-accent-soft" },
  admin: { label: "admin", icon: WrenchIcon, classes: "text-gold-text bg-gold-soft" },
  viewer: { label: "viewer", icon: EyeIcon, classes: "text-sage-text bg-sage-soft" },
};

interface ListCardProps {
  list: TodoList;
  role: Role;
  onRename: () => void;
  onDelete: () => void;
}

export function ListCard({ list, role, onRename, onDelete }: ListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = roleMeta[role];
  const RoleIcon = meta.icon;
  const memberCount = Object.keys(list.members).length;

  return (
    <article className="relative rounded-card border border-line bg-surface p-[1.4rem] shadow-rest transition-transform hover:-translate-y-1 hover:shadow-lift">
      <div className="mb-[0.85rem] flex items-start justify-between gap-2">
        <span
          className={`inline-flex -rotate-[4deg] items-center gap-[0.35rem] rounded-full border border-dashed border-current px-[0.6rem] py-[0.32rem] text-[0.72rem] font-bold ${meta.classes}`}
        >
          <RoleIcon className="h-3 w-3" />
          {meta.label}
        </span>
        {role === "owner" && (
          <div className="relative">
            <button
              type="button"
              aria-label="List options"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-ink-faint hover:bg-surface-sunk hover:text-ink"
            >
              <KebabIcon className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-10 flex min-w-[150px] flex-col gap-1 rounded-lg border border-line bg-surface p-[0.35rem] shadow-lift">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename();
                  }}
                  className="rounded-md px-[0.65rem] py-2 text-left text-sm font-semibold hover:bg-surface-sunk"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="rounded-md px-[0.65rem] py-2 text-left text-sm font-semibold text-danger hover:bg-surface-sunk"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <h3 className="mb-3 font-display text-xl font-semibold text-ink">
        <Link href={`/lists/${list.id}`} className="hover:text-accent-text">
          {list.title}
        </Link>
      </h3>

      <div className="mb-1 text-xs text-ink-faint">Updated {formatRelativeTime(list.updatedAt)}</div>
      <div className="text-xs text-ink-faint">
        {memberCount} member{memberCount === 1 ? "" : "s"}
      </div>
    </article>
  );
}
```

Note: task-count progress ticks from the design preview are intentionally dropped here — showing them would need each card to subscribe to that list's `tasks` subcollection just for a decorative indicator (see Global Constraints). Member count and relative-updated-time are shown instead, both free from `list` fields already loaded.

- [ ] **Step 3: Rewrite `src/app/(app)/lists/page.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import { deleteList } from "@/lib/firestore/lists";
import { CreateListModal } from "@/components/lists/CreateListModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListCard } from "@/components/lists/ListCard";
import { Button } from "@/components/ui/Button";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { toast } from "sonner";
import type { TodoList } from "@/lib/types";

type SortOption = "updated" | "name";

export default function ListsPage() {
  const { user } = useAuth();
  const { lists, loading } = useLists();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("updated");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<TodoList | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TodoList | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = term ? lists.filter((l) => l.title.toLowerCase().includes(term)) : lists;
    return [...result].sort((a, b) => (sort === "name" ? a.title.localeCompare(b.title) : b.updatedAt - a.updatedAt));
  }, [lists, search, sort]);

  // Stat pills use the full unfiltered `lists` so they don't shift while
  // the user is mid-search — only the rendered groups below use `filtered`.
  const sharedCount = user ? lists.filter((l) => l.members[user.uid] !== "owner").length : 0;
  const ownLists = filtered.filter((l) => user && l.members[user.uid] === "owner");
  const sharedLists = filtered.filter((l) => user && l.members[user.uid] !== "owner");

  if (!user) return null;

  return (
    <main className="mx-auto max-w-[1360px] px-10 py-11">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[2.75rem] font-bold leading-tight text-ink">
            Welcome back, {user.displayName ?? user.email}
          </h1>
          <span className="mt-1 block -rotate-1 font-hand text-[1.3rem] text-accent-text">
            here&apos;s what&apos;s moving across your lists
          </span>
        </div>
        <div className="flex gap-[0.9rem]">
          <div className="min-w-[130px] rounded-xl border border-line bg-surface px-[1.15rem] py-[0.85rem]">
            <b className="block font-display text-xl">{lists.length}</b>
            <span className="text-xs text-ink-soft">Lists</span>
          </div>
          <div className="min-w-[130px] rounded-xl border border-line bg-surface px-[1.15rem] py-[0.85rem]">
            <b className="block font-display text-xl">{sharedCount}</b>
            <span className="text-xs text-ink-soft">Shared with you</span>
          </div>
        </div>
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div className="relative max-w-[280px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-[0.85rem] top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lists..."
            className="w-full rounded-full border border-line bg-surface-sunk py-[0.65rem] pl-[2.4rem] pr-[0.9rem] text-sm"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-line-strong bg-surface px-[0.9rem] py-[0.65rem] text-sm font-semibold"
        >
          <option value="updated">Sort: Recently updated</option>
          <option value="name">Sort: Name (A–Z)</option>
        </select>
        <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          New list
        </Button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Loading lists…</p>
      ) : (
        <>
          <ListGroup title="Your lists" lists={ownLists} userUid={user.uid} onRename={setRenameTarget} onDelete={setDeleteTarget} />
          <div className="mt-11">
            <ListGroup title="Shared with you" lists={sharedLists} userUid={user.uid} onRename={setRenameTarget} onDelete={setDeleteTarget} />
          </div>
        </>
      )}

      <CreateListModal open={createOpen} onClose={() => setCreateOpen(false)} ownerId={user.uid} />
      <CreateListModal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        ownerId={user.uid}
        initial={renameTarget ? { id: renameTarget.id, title: renameTarget.title } : undefined}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete list?"
        body={`"${deleteTarget?.title}" and all its tasks will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteList(deleteTarget.id);
          toast.success("List deleted");
        }}
      />
    </main>
  );
}

function ListGroup({
  title,
  lists,
  userUid,
  onRename,
  onDelete,
}: {
  title: string;
  lists: TodoList[];
  userUid: string;
  onRename: (list: TodoList) => void;
  onDelete: (list: TodoList) => void;
}) {
  if (lists.length === 0) return null;
  return (
    <section>
      <h2 className="mb-[1.15rem] font-display text-[1.75rem] font-semibold text-ink">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-7">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            role={list.members[userUid]}
            onRename={() => onRename(list)}
            onDelete={() => onDelete(list)}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`, sign in as Olivia.
- Dashboard shows "Your lists" with the lists created in Tasks 7–8 (each as a card with an "owner" stamp, kebab menu visible).
- Type into the search box → grid filters live to matching titles; clear it → all return.
- Switch the sort `<select>` to "Name (A–Z)" → cards reorder alphabetically.
- Click a card's kebab → "Rename"/"Delete" menu appears. Click "Rename" → `CreateListModal` opens prefilled with the current title (not empty) and its heading reads "Rename list"; save a new title → card updates live, no page reload.
- Click kebab → "Delete" → confirm dialog appears with the list's real name in the body copy → confirm → card disappears and a "List deleted" toast shows.
- "Shared with you" section stays hidden (no `<h2>` for it) as long as `sharedLists` is empty — expected until Task 13 lets you add yourself to someone else's list; that's fine to leave unverified here.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/components/lists/ListCard.tsx src/app/(app)/lists/page.tsx
git commit -m "feat: build full dashboard UI with search, sort, and list management"
```

---

## Task 10: Tasks data layer (`lib/firestore/tasks.ts`, `useTasks`)

**Files:**
- Create: `src/lib/firestore/tasks.ts`
- Create: `src/hooks/useTasks.ts`

**Interfaces:**
- Consumes: `db` (Task 2); `Task` type (Task 3).
- Produces: `subscribeToTasks(listId, cb): Unsubscribe`, `createTask(listId, title, description): Promise<void>`, `updateTask(listId, taskId, { title, description }): Promise<void>`, `deleteTask(listId, taskId): Promise<void>`, `toggleTaskCompleted(listId, taskId, completed): Promise<void>` from `@/lib/firestore/tasks` — `toggleTaskCompleted` must only touch `completed`/`updatedAt` fields (Task 2's security rule depends on this for the viewer point-update exception).
- Produces: `useTasks(listId: string): { tasks: Task[]; loading: boolean }` from `@/hooks/useTasks` — consumed by Task 11/12.

- [ ] **Step 1: Write `src/lib/firestore/tasks.ts`**

```ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Task } from "@/lib/types";

function toTask(id: string, data: DocumentData): Task {
  return {
    id,
    title: data.title,
    description: data.description,
    completed: data.completed,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function tasksCollection(listId: string) {
  return collection(db, "lists", listId, "tasks");
}

export function subscribeToTasks(listId: string, callback: (tasks: Task[]) => void): Unsubscribe {
  const q = query(tasksCollection(listId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toTask(d.id, d.data())));
  });
}

export async function createTask(listId: string, title: string, description: string): Promise<void> {
  const now = Date.now();
  await addDoc(tasksCollection(listId), {
    title,
    description,
    completed: false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTask(
  listId: string,
  taskId: string,
  data: { title: string; description: string }
): Promise<void> {
  await updateDoc(doc(db, "lists", listId, "tasks", taskId), { ...data, updatedAt: Date.now() });
}

export async function deleteTask(listId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, "lists", listId, "tasks", taskId));
}

export async function toggleTaskCompleted(listId: string, taskId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, "lists", listId, "tasks", taskId), { completed, updatedAt: Date.now() });
}
```

- [ ] **Step 2: Write `src/hooks/useTasks.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import { subscribeToTasks } from "@/lib/firestore/tasks";
import type { Task } from "@/lib/types";

export function useTasks(listId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTasks(listId, (result) => {
      setTasks(result);
      setLoading(false);
    });
    return unsubscribe;
  }, [listId]);

  return { tasks, loading };
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors. This task has no consuming UI yet — full end-to-end verification (create/toggle/edit/delete a task through the browser) happens in Tasks 11–12, which build the list detail page on top of these exact function names.

- [ ] **Step 4: Commit**

```bash
git add src/lib/firestore/tasks.ts src/hooks/useTasks.ts
git commit -m "feat: add tasks Firestore data layer with realtime hook"
```

---

## Task 11: TaskModal, list detail page skeleton

**Files:**
- Create: `src/components/tasks/TaskModal.tsx`
- Create: `src/app/(app)/lists/[listId]/page.tsx`

**Interfaces:**
- Consumes: `Modal`, `Button`, `Field` (Tasks 5/8); `taskSchema`/`TaskFormValues` (Task 3); `createTask`, `updateTask` (Task 10); `useListDetail` (Task 7); `useTasks` (Task 10); `useAuth` (Task 4); `ChevronLeftIcon`, `PlusIcon` (Task 6); `CreateListModal` (Task 8, reused here for the list's rename affordance).
- Produces: `TaskModal` from `@/components/tasks/TaskModal` — props `{ open: boolean; onClose: () => void; listId: string; initial?: { id: string; title: string; description: string } }` — consumed by Task 12 (edit trigger) in addition to this task's "+ Add task" trigger.

- [ ] **Step 1: Write `src/components/tasks/TaskModal.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: initial?.title ?? "", description: initial?.description ?? "" },
  });

  useEffect(() => {
    reset({ title: initial?.title ?? "", description: initial?.description ?? "" });
  }, [initial, reset]);

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
```

- [ ] **Step 2: Write `src/app/(app)/lists/[listId]/page.tsx`**

```tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useListDetail } from "@/hooks/useListDetail";
import { useTasks } from "@/hooks/useTasks";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, PlusIcon } from "@/components/ui/icons";

export default function ListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const { user } = useAuth();
  const { list, role, loading: listLoading } = useListDetail(listId);
  const { tasks, loading: tasksLoading } = useTasks(listId);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const canEdit = role === "owner" || role === "admin";

  if (listLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-ink-soft">Loading…</p>
      </main>
    );
  }

  if (!list) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg">
        <p className="text-ink-soft">This list doesn&apos;t exist, or you don&apos;t have access.</p>
        <Link href="/lists" className="font-bold text-accent-text">
          Back to lists
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1360px] px-10 py-11">
      <Link href="/lists" className="mb-6 inline-flex items-center gap-[0.4rem] text-sm font-bold text-ink-soft hover:text-accent-text">
        <ChevronLeftIcon className="h-[15px] w-[15px]" />
        Back to lists
      </Link>

      <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.75rem] font-bold leading-tight text-ink">{list.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {tasks.filter((t) => t.completed).length} of {tasks.length} done · your role: {role}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setTaskModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Add task
          </Button>
        )}
      </div>

      {tasksLoading ? (
        <p className="text-ink-soft">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-ink-soft">No tasks yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-lg border border-line bg-surface px-5 py-4">
              <span className="font-bold text-ink">{task.title}</span>
              {task.description && <p className="mt-1 text-sm text-ink-soft">{task.description}</p>}
              <p className="mt-1 text-xs text-ink-faint">{task.completed ? "Completed" : "Not completed"}</p>
            </li>
          ))}
        </ul>
      )}

      {canEdit && <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} listId={listId} />}
    </main>
  );
}
```

This renders tasks as plain rows for now (no checkbox, no edit/delete, no members) — Task 12 replaces the `<ul>` with the real `TaskItem` component, Task 13 adds the members sidebar.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`, sign in as Olivia, click into "Office Move" (or whichever list exists) from the dashboard.
- Expect the URL to be `/lists/<id>`, the list title as a large heading, "0 of 0 done · your role: owner", and a visible "Add task" button (Olivia is owner).
- Click "Add task", submit empty → inline "Give the task a title" error. Fill Title "Book a moving truck", Description "Compare three companies", submit.
Expected: "Task added" toast, modal closes, the task appears in the list live as a plain row with "Not completed" — and a matching doc appears under `lists/<id>/tasks` in the Firestore console with `completed: false`.
- Click "Back to lists" → returns to the dashboard.

- [ ] **Step 4: Commit**

```bash
git add src/components/tasks/TaskModal.tsx "src/app/(app)/lists/[listId]"
git commit -m "feat: add TaskModal and list detail page skeleton"
```

---

## Task 12: TaskItem (hand-drawn checkbox, strike-through, role-gated actions), wire into list detail page

**Files:**
- Create: `src/components/tasks/TaskItem.tsx`
- Modify: `src/app/(app)/lists/[listId]/page.tsx` (replace the plain `<ul>` rows from Task 11)

**Interfaces:**
- Consumes: `toggleTaskCompleted`, `deleteTask` (Task 10); `CheckIcon`, `PencilIcon`, `TrashIcon` (Task 6); `ConfirmDialog` (Task 8); `Task` type (Task 3); `TaskModal` (Task 11).
- Produces: `TaskItem` from `@/components/tasks/TaskItem` — props `{ task: Task; listId: string; canEdit: boolean; onEdit: () => void }`.

Note on the checkbox animation: the design preview used a CSS `:checked` pseudo-class trick because that mockup was static HTML with no framework state. Here `task.completed` is real data from Firestore, so `TaskItem` drives the same stroke-dashoffset draw and strike-through line with plain conditional classNames/inline styles off that boolean — simpler and more correct than porting the CSS-only trick into React.

- [ ] **Step 1: Write `src/components/tasks/TaskItem.tsx`**

```tsx
"use client";

import { useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { toggleTaskCompleted, deleteTask } from "@/lib/firestore/tasks";
import { CheckIcon, PencilIcon, TrashIcon } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  listId: string;
  canEdit: boolean;
  onEdit: () => void;
}

export function TaskItem({ task, listId, canEdit, onEdit }: TaskItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <li className="relative flex items-start gap-4 rounded-lg border border-l-[3px] border-dashed border-line border-l-line-strong bg-surface px-[1.15rem] py-[1.05rem] pl-[1.7rem]">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? "Mark as not completed" : "Mark as completed"}
        onClick={() => toggleTaskCompleted(listId, task.id, !task.completed)}
        className={clsx(
          "mt-0.5 flex h-[25px] w-[25px] flex-none items-center justify-center rounded-[7px] border-[1.8px] transition-colors",
          task.completed ? "border-sage bg-sage-soft" : "border-line-strong bg-surface"
        )}
      >
        <CheckIcon
          className="h-[15px] w-[15px] text-sage-text transition-[stroke-dashoffset] duration-300"
          style={{ strokeDasharray: 20, strokeDashoffset: task.completed ? 0 : 20 }}
        />
      </button>

      <div className="min-w-0 flex-1">
        <span className="relative inline-block text-lg font-bold">
          <span className={task.completed ? "text-ink-soft" : "text-ink"}>{task.title}</span>
          <span
            className={clsx(
              "absolute left-0 top-1/2 h-[2px] w-full origin-left bg-sage-text transition-transform duration-300",
              task.completed ? "scale-x-100" : "scale-x-0"
            )}
          />
        </span>
        {task.description && (
          <p className={clsx("mt-1 text-sm", task.completed ? "text-ink-faint" : "text-ink-soft")}>{task.description}</p>
        )}
      </div>

      {canEdit && (
        <div className="mt-0.5 flex flex-none gap-[0.4rem]">
          <button
            type="button"
            aria-label="Edit"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-sunk text-ink-soft hover:border-accent hover:text-accent-text"
          >
            <PencilIcon className="h-[15px] w-[15px]" />
          </button>
          <button
            type="button"
            aria-label="Delete"
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-sunk text-ink-soft hover:border-danger hover:text-danger"
          >
            <TrashIcon className="h-[15px] w-[15px]" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete task?"
        body={`"${task.title}" will be permanently deleted. This can't be undone.`}
        onConfirm={() => {
          deleteTask(listId, task.id);
          toast.success("Task deleted");
        }}
      />
    </li>
  );
}
```

- [ ] **Step 2: Replace the task list rendering in `src/app/(app)/lists/[listId]/page.tsx`**

Full file (adds `TaskItem`, a unified `taskModalTarget` state covering both "new" and "edit", and passes `canEdit` down):

```tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useListDetail } from "@/hooks/useListDetail";
import { useTasks } from "@/hooks/useTasks";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, PlusIcon } from "@/components/ui/icons";
import type { Task } from "@/lib/types";

export default function ListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const { user } = useAuth();
  const { list, role, loading: listLoading } = useListDetail(listId);
  const { tasks, loading: tasksLoading } = useTasks(listId);
  const [taskModalTarget, setTaskModalTarget] = useState<Task | "new" | null>(null);

  const canEdit = role === "owner" || role === "admin";

  if (listLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-ink-soft">Loading…</p>
      </main>
    );
  }

  if (!list) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg">
        <p className="text-ink-soft">This list doesn&apos;t exist, or you don&apos;t have access.</p>
        <Link href="/lists" className="font-bold text-accent-text">
          Back to lists
        </Link>
      </main>
    );
  }

  const editingTask = taskModalTarget && taskModalTarget !== "new" ? taskModalTarget : undefined;

  return (
    <main className="mx-auto max-w-[1360px] px-10 py-11">
      <Link href="/lists" className="mb-6 inline-flex items-center gap-[0.4rem] text-sm font-bold text-ink-soft hover:text-accent-text">
        <ChevronLeftIcon className="h-[15px] w-[15px]" />
        Back to lists
      </Link>

      <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.75rem] font-bold leading-tight text-ink">{list.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {tasks.filter((t) => t.completed).length} of {tasks.length} done · your role: {role}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setTaskModalTarget("new")}>
            <PlusIcon className="h-4 w-4" />
            Add task
          </Button>
        )}
      </div>

      {tasksLoading ? (
        <p className="text-ink-soft">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-ink-soft">No tasks yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              listId={listId}
              canEdit={canEdit}
              onEdit={() => setTaskModalTarget(task)}
            />
          ))}
        </ul>
      )}

      {canEdit && (
        <TaskModal
          open={taskModalTarget !== null}
          onClose={() => setTaskModalTarget(null)}
          listId={listId}
          initial={editingTask ? { id: editingTask.id, title: editingTask.title, description: editingTask.description } : undefined}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`, sign in as Olivia, open the list from Task 11 with the "Book a moving truck" task.
- Click the checkbox → expect the border/background to turn sage and the checkmark to draw in (stroke animates in ~300ms), the title fades to muted ink-soft with a sage strike-through line animating across it, description (if any) fades too. The "X of Y done" counter above updates live.
- Click it again → everything animates back to the unchecked state.
- Click the pencil icon → `TaskModal` opens prefilled with the task's current title/description and heading "Edit task" (not "New task"). Change the title, save → task row updates live, "Task saved" toast.
- Click the trash icon → `ConfirmDialog` opens with the task's real title in the body text → confirm → row disappears, "Task deleted" toast, counter updates.

- [ ] **Step 4: Commit**

```bash
git add src/components/tasks/TaskItem.tsx "src/app/(app)/lists/[listId]/page.tsx"
git commit -m "feat: add TaskItem with hand-drawn checkbox animation and wire CRUD"
```

---

## Task 13: Members panel, invite-by-email modal, remove-member wiring

**Files:**
- Modify: `src/lib/firestore/users.ts` (add `getUserProfile`)
- Create: `src/hooks/useMemberProfiles.ts`
- Create: `src/components/lists/AddMemberModal.tsx`
- Create: `src/components/lists/MembersPanel.tsx`
- Modify: `src/app/(app)/lists/[listId]/page.tsx` (two-column layout with the members sidebar)

**Interfaces:**
- Consumes: `db` (Task 2); `Modal`, `Button`, `Field`, `ConfirmDialog` (Tasks 5/8); `memberSchema`/`MemberFormValues` (Task 3); `addMember`, `removeMember` (Task 7); `PlusIcon`, `CloseIcon` (Task 6); `Role`, `UserProfile` (Task 3).
- Produces: `getUserProfile(uid: string): Promise<UserProfile | null>` added to `@/lib/firestore/users`.
- Produces: `useMemberProfiles(members: Record<string, Role>): { uid: string; role: Role; profile: UserProfile | null }[]` from `@/hooks/useMemberProfiles`.
- Produces: `AddMemberModal` from `@/components/lists/AddMemberModal` — props `{ open: boolean; onClose: () => void; listId: string }`.
- Produces: `MembersPanel` from `@/components/lists/MembersPanel` — props `{ listId: string; members: Record<string, Role>; isOwner: boolean; currentUid: string }`.

- [ ] **Step 1: Add `getUserProfile` to `src/lib/firestore/users.ts`**

Add this import and function to the existing file (don't remove `createUserProfile`/`findUserByEmail`):

```ts
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
```

(replace the existing `firebase/firestore` import line with this one — it's the same as before plus `getDoc`)

```ts
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}
```

- [ ] **Step 2: Write `src/hooks/useMemberProfiles.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/firestore/users";
import type { Role, UserProfile } from "@/lib/types";

export interface MemberEntry {
  uid: string;
  role: Role;
  profile: UserProfile | null;
}

export function useMemberProfiles(members: Record<string, Role>): MemberEntry[] {
  const [entries, setEntries] = useState<MemberEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const uids = Object.keys(members);
    Promise.all(uids.map((uid) => getUserProfile(uid))).then((profiles) => {
      if (cancelled) return;
      setEntries(uids.map((uid, i) => ({ uid, role: members[uid], profile: profiles[i] })));
    });
    return () => {
      cancelled = true;
    };
  }, [members]);

  return entries;
}
```

- [ ] **Step 3: Write `src/components/lists/AddMemberModal.tsx`**

```tsx
"use client";

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
```

- [ ] **Step 4: Write `src/components/lists/MembersPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { removeMember } from "@/lib/firestore/lists";
import { useMemberProfiles } from "@/hooks/useMemberProfiles";
import { AddMemberModal } from "@/components/lists/AddMemberModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PlusIcon, CloseIcon } from "@/components/ui/icons";
import type { Role } from "@/lib/types";

interface MembersPanelProps {
  listId: string;
  members: Record<string, Role>;
  isOwner: boolean;
  currentUid: string;
}

const avatarClasses: Record<Role, string> = {
  owner: "bg-accent-soft",
  admin: "bg-gold-soft",
  viewer: "bg-sage-soft",
};

export function MembersPanel({ listId, members, isOwner, currentUid }: MembersPanelProps) {
  const entries = useMemberProfiles(members);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ uid: string; label: string } | null>(null);

  return (
    <aside className="sticky top-[100px] rounded-card border border-line bg-surface p-[1.35rem]">
      <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ink-soft">
        Members
        {isOwner && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1 normal-case tracking-normal text-accent-text"
          >
            <PlusIcon className="h-[13px] w-[13px]" />
            Invite
          </button>
        )}
      </div>
      <ul className="flex flex-col">
        {entries.map((entry) => {
          const displayName = entry.profile?.name ?? "Unknown user";
          const label = entry.uid === currentUid ? `${displayName} (you)` : displayName;
          return (
            <li key={entry.uid} className="flex items-center gap-[0.6rem] border-t border-dashed border-line py-2 first:border-t-0">
              <span
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-full font-display text-xs font-semibold ${avatarClasses[entry.role]}`}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{label}</span>
                <span className="text-xs text-ink-faint">{entry.role}</span>
              </span>
              {isOwner && entry.role !== "owner" && (
                <button
                  type="button"
                  aria-label={`Remove ${displayName}`}
                  onClick={() => setRemoveTarget({ uid: entry.uid, label: displayName })}
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-ink-faint hover:bg-danger-soft hover:text-danger"
                >
                  <CloseIcon className="h-[14px] w-[14px]" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {isOwner && <AddMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} listId={listId} />}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove member?"
        body={`${removeTarget?.label} will lose access to this list immediately.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (!removeTarget) return;
          removeMember(listId, removeTarget.uid);
          toast.success("Member removed");
        }}
      />
    </aside>
  );
}
```

- [ ] **Step 5: Wire `MembersPanel` into the list detail page — modify `src/app/(app)/lists/[listId]/page.tsx`**

Replace the task-rendering block (the `{tasksLoading ? ... }` expression) and everything below it with a two-column grid that adds the sidebar. Full file:

```tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useListDetail } from "@/hooks/useListDetail";
import { useTasks } from "@/hooks/useTasks";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskItem } from "@/components/tasks/TaskItem";
import { MembersPanel } from "@/components/lists/MembersPanel";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, PlusIcon } from "@/components/ui/icons";
import type { Task } from "@/lib/types";

export default function ListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const { user } = useAuth();
  const { list, role, loading: listLoading } = useListDetail(listId);
  const { tasks, loading: tasksLoading } = useTasks(listId);
  const [taskModalTarget, setTaskModalTarget] = useState<Task | "new" | null>(null);

  const canEdit = role === "owner" || role === "admin";

  if (listLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-ink-soft">Loading…</p>
      </main>
    );
  }

  if (!list) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg">
        <p className="text-ink-soft">This list doesn&apos;t exist, or you don&apos;t have access.</p>
        <Link href="/lists" className="font-bold text-accent-text">
          Back to lists
        </Link>
      </main>
    );
  }

  const editingTask = taskModalTarget && taskModalTarget !== "new" ? taskModalTarget : undefined;

  return (
    <main className="mx-auto max-w-[1360px] px-10 py-11">
      <Link href="/lists" className="mb-6 inline-flex items-center gap-[0.4rem] text-sm font-bold text-ink-soft hover:text-accent-text">
        <ChevronLeftIcon className="h-[15px] w-[15px]" />
        Back to lists
      </Link>

      <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.75rem] font-bold leading-tight text-ink">{list.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {tasks.filter((t) => t.completed).length} of {tasks.length} done · your role: {role}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setTaskModalTarget("new")}>
            <PlusIcon className="h-4 w-4" />
            Add task
          </Button>
        )}
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {tasksLoading ? (
            <p className="text-ink-soft">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="text-ink-soft">No tasks yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  listId={listId}
                  canEdit={canEdit}
                  onEdit={() => setTaskModalTarget(task)}
                />
              ))}
            </ul>
          )}
        </div>

        <MembersPanel listId={listId} members={list.members} isOwner={role === "owner"} currentUid={user.uid} />
      </div>

      {canEdit && (
        <TaskModal
          open={taskModalTarget !== null}
          onClose={() => setTaskModalTarget(null)}
          listId={listId}
          initial={editingTask ? { id: editingTask.id, title: editingTask.title, description: editingTask.description } : undefined}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`.
Expected: no type errors.

Run: `npm run dev`, sign in as Olivia, open a list.
- Sidebar shows "Members" with one row: "Olivia Bennett (you)" and role "owner", an "Invite" link visible (Olivia is owner).
- Click "Invite" → `AddMemberModal` opens. Submit an email with no account (e.g. `nobody@example.com`) → expect a "No account found with that email" error toast, modal stays open.
- Register a second account in another browser/incognito window (e.g. `marcus@example.com` / `test1234` / name "Marcus") via `/register`, then back in Olivia's session invite `marcus@example.com` as **Admin** → expect "Invite sent" toast, and a new "Marcus" row appears live in the members list with role "admin" and a remove ("×") button next to it (Olivia is owner, target isn't owner).
- Sign in as Marcus in the other window, go to `/lists` → the list now appears under "Shared with you" with an "admin" stamp, and Marcus can open it and sees the "Add task" button (canEdit is true for admin) but no "Invite" control in the members sidebar (isOwner is false).
- Back in Olivia's window, click the "×" next to Marcus → confirm dialog with Marcus's name → confirm → row disappears, "Member removed" toast. Refresh Marcus's dashboard → the list is gone from his view.

- [ ] **Step 7: Commit**

```bash
git add src/lib/firestore/users.ts src/hooks/useMemberProfiles.ts src/components/lists/AddMemberModal.tsx src/components/lists/MembersPanel.tsx "src/app/(app)/lists/[listId]/page.tsx"
git commit -m "feat: add members panel, invite-by-email modal, and remove-member flow"
```

---

## Task 14: Deploy Firestore security rules, verify the permission matrix for real

**Files:**
- None created/modified — this task deploys and manually verifies `firestore.rules` (written in Task 2) against the live app built through Task 13.

**Interfaces:**
- Consumes: everything built so far. No new exports.

- [ ] **Step 1: Install the Firebase CLI (if not already available) and log in**

```bash
npm install -g firebase-tools
firebase login
```

- [ ] **Step 2: Link the local project to the Firebase project from Task 2**

```bash
firebase use --add
```

Pick the project created in Task 2, give it an alias (e.g. `default`).

- [ ] **Step 3: Deploy the rules**

```bash
firebase deploy --only firestore:rules
```

Expected: CLI output ends with "Deploy complete!". In the Firebase console, Firestore → Rules tab shows the exact content of `firestore.rules`.

- [ ] **Step 4: Manually verify the permission matrix per role**

Everything up through Task 13 already enforces roles in the **UI** (buttons hidden/shown by `canEdit`/`isOwner`). This step confirms the **rules themselves** are what's actually blocking disallowed writes, not just the UI hiding buttons — open the browser DevTools console on the list detail page and try to bypass the UI directly:

Signed in as **Tanya** (register a third throwaway account, have Olivia invite `tanya@example.com` as **Viewer** via the members panel), open the list, open DevTools console, and paste (adjust `listId`/`taskId` to a real task from the page):

```js
import("/_next/static/chunks/...")  // not needed — instead call through the already-loaded app:
```

Simpler: since the app doesn't expose a global debug hook, verify indirectly through the UI, which is sufficient proof the rules are active:
1. As Tanya (viewer): confirm no "Add task" button, no pencil/trash icons on any task row, no "Invite" link in the members panel — the UI already hides these because `role === 'viewer'`.
2. As Tanya, click a task's checkbox → expect it toggles successfully (viewer is allowed the `completed`-only update) and a live update appears — this proves the rule's viewer point-update exception works, not just the UI.
3. Temporarily (for this test only) comment out the `canEdit && (...)` guard around the "Add task" button in `src/app/(app)/lists/[listId]/page.tsx` and reload as Tanya — the button now renders, but clicking it and submitting a task must fail: expect the `createTask` call to reject and the "Something went wrong, try again" toast to show, because the security rule — not the UI — is the real gate. Confirm no new document appears in `lists/<id>/tasks` in the Firestore console. **Revert this temporary change immediately after confirming the failure** (`git checkout -- "src/app/(app)/lists/[listId]/page.tsx"`).
4. As Marcus (admin, from Task 13): confirm task CRUD works but there's still no "Invite" control and no way to rename/delete the list from the dashboard kebab menu (owner-only rule).

Expected: all four checks pass. If step 3's write succeeds instead of failing, the rules in `firestore.rules` don't match what's deployed — re-run Step 3 and re-check the Firebase console's Rules tab content before re-testing.

- [ ] **Step 5: Commit**

Nothing to commit from this task (rules were already committed in Task 2; this task only deployed and verified them). If Step 4.3's temporary edit wasn't fully reverted, `git status` must show a clean working tree before moving on — fix it now if not.

---

## Task 15: Deploy to Vercel

**Files:**
- Create: `README.md` (setup + deploy notes for whoever reviews this test task)

**Interfaces:**
- Consumes: everything built so far. No new exports.

- [ ] **Step 1: Write `README.md`**

```markdown
# Together — shared to-do lists

Next.js + TypeScript + Tailwind + Firebase (Auth + Firestore) to-do app with per-list roles (Owner / Admin / Viewer).

## Local development

1. Copy `.env.local.example` to `.env.local` and fill in your Firebase project's web app config (Firebase console → Project settings → General → Your apps).
2. `npm install`
3. `npm run dev` — open http://localhost:3000

## Firestore security rules

Deploy with the Firebase CLI: `firebase deploy --only firestore:rules` (requires `firebase login` and `firebase use --add` once, see `docs/superpowers/plans/2026-08-12-todo-app-implementation.md` Task 14).

## Design & architecture docs

- `docs/superpowers/specs/2026-08-12-todo-app-design.md` — architecture and design decisions
- `docs/superpowers/specs/2026-08-12-todo-app-discovery-log.md` — requirements discovery Q&A
- `docs/superpowers/plans/2026-08-12-todo-app-implementation.md` — this build's task-by-task implementation plan
```

- [ ] **Step 2: Push to GitHub**

```bash
git remote add origin <the repo URL the user provides>
git push -u origin main
```

(Ask the user for the target GitHub repo URL before running this — this plan doesn't assume one exists yet.)

- [ ] **Step 3: Create the Vercel project**

Via the Vercel dashboard: New Project → import the GitHub repo → framework preset auto-detects Next.js → before deploying, open "Environment Variables" and add all six `NEXT_PUBLIC_FIREBASE_*` keys from `.env.local` (Production + Preview + Development) → Deploy.

- [ ] **Step 4: Verify the production deployment**

Open the Vercel-assigned URL.
- Register a fresh account through the production URL → confirm redirect to `/lists`, confirm the new user appears in the Firebase console (proves env vars are wired correctly in production, not just localhost).
- Create a list, add a task, toggle it, invite a second account, sign in as that account in another browser, confirm the shared list appears under "Shared with you".
- Confirm the warm design (Unbounded/Golos Text/Caveat fonts, near-white background, accent colors) renders identically to local dev — if fonts fall back to a system sans-serif, re-check Task 1's `next/font/google` setup deployed correctly (check the Network tab for font requests failing).

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and deployment notes"
git push
```

---

## Self-Review

**Spec coverage** — every functional requirement from `ТЗ.txt` and the design spec traces to a task:
- Register/login/persisted session → Tasks 4–6 (Firebase Auth SDK persistence, no manual token code, per design spec §3.2).
- Create/rename/delete list → Tasks 7–9.
- Add/edit/delete task, toggle completed → Tasks 10–12.
- Owner/Admin/Viewer roles, add-by-email, remove member → Tasks 7, 13; enforced server-side → Task 2 rules, verified → Task 14.
- Dashboard (all accessible lists) → own list detail page → Tasks 9, 11–13 (separate routes, not combined).
- Forms via react-hook-form+zod → every form task (5, 6, 8, 11, 13).
- Toasts via `sonner` → mounted Task 4, used inline in every mutating task from 8 onward.
- Deploy → Task 15.

**Placeholder scan** — no TBD/TODO markers; every step has real, complete code or an exact manual verification script.

**Type consistency** — cross-checked: `Role`/`UserProfile`/`TodoList`/`Task` (Task 3) used identically in every later task; `useAuth()` return shape `{ user, initializing }` matches its Task 4 definition everywhere it's called (Tasks 6, 7, 9, 11–13); `CreateListModal`'s `initial?: { id, title }` prop matches how Task 9 passes `renameTarget`; `TaskModal`'s `initial?: { id, title, description }` matches how Task 12 passes `editingTask`; `toggleTaskCompleted`/`updateTask`/`deleteTask` signatures in Task 10 match every call site in Tasks 11–12; `MembersPanel`'s `members: Record<string, Role>` matches `TodoList.members`'s type from Task 3.

**Scope check** — this is one cohesive app, not several independent subsystems; sequencing (auth → lists data → dashboard UI → tasks data → detail UI → members → rules → deploy) is dependency order within a single plan, not a sign it should have been split into separate specs.

