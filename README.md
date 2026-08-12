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
