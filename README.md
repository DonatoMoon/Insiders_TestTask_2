# Together — shared to-do lists

Next.js + TypeScript + Tailwind + Firebase (Auth + Firestore) to-do app with per-list roles (Owner / Admin / Viewer).

## Local development

1. Copy `.env.local.example` to `.env.local` and fill in your Firebase project's web app config (Firebase console → Project settings → General → Your apps).
2. `npm install`
3. `npm run dev` — open http://localhost:3000

## Firestore security rules

Deploy with the Firebase CLI: `firebase deploy --only firestore:rules` (requires `firebase login` and `firebase use --add` once, see `docs/superpowers/plans/2026-08-12-todo-app-implementation.md` Task 14).

The CLI is not a project dependency — install it first with `npm i -g firebase-tools`, otherwise `firebase login` / `firebase deploy` won't be on your PATH. The rules in `firestore.rules` can also be published by hand: Firebase console → Firestore Database → Rules → paste → Publish.

## Deployment

1. Import the repository into [Vercel](https://vercel.com/new) — the framework is auto-detected as Next.js, so no build/output overrides are needed.
2. Before the first deploy, add the six Firebase web-config values as environment variables in the Vercel dashboard (Settings → Environment Variables), enabled for **Production**, **Preview**, and **Development**:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
3. Deploy, then add the Vercel domain under Firebase console → Authentication → Settings → Authorized domains, so sign-in works from the deployed origin.
4. Publish `firestore.rules` to the Firebase project (see above) — Vercel deploys the app only, never the rules.