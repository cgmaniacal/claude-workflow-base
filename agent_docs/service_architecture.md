# Service Architecture

## Project Scale

This boilerplate supports two configurations:

- **Frontend only** — Just `apps/web`. No API server, no database. Suitable for static sites, SPAs with external APIs, or content-driven pages.
- **Full stack** — `apps/web` + `apps/api` + `packages/shared` + MySQL. For applications that need their own data persistence and internal APIs.

When starting a new project, delete what you don't need. The sections below describe the full-stack setup. Frontend-only projects can ignore everything after the `apps/web` section.

## Full-Stack Overview

```
┌─────────────┐     HTTP/JSON     ┌─────────────┐     Prisma     ┌─────────┐
│   apps/web  │  ──────────────>  │   apps/api  │  ──────────>   │  MySQL  │
│  React SPA  │  <──────────────  │   Express   │  <──────────   │         │
└─────────────┘                   └─────────────┘                └─────────┘
       │                                │
       └──────── both import ───────────┘
                      │
              ┌───────────────┐
              │packages/shared│
              │ types, utils  │
              └───────────────┘
```

## apps/web (Frontend)

- **Framework:** React + TypeScript
- **Bundler:** Vite (dev server + build)
- **Styling:** TailwindCSS + SASS modules
- **State:** Zustand for global state, React state for local
- **Routing:** TBD (React Router or TanStack Router)

### Source Structure

```
apps/web/src/
  components/       # Shared UI components
  features/         # Feature-grouped modules (components, hooks, api calls)
  hooks/            # Shared custom hooks
  stores/           # Zustand stores
  styles/           # Global SASS, Tailwind config
  lib/              # Utility functions, API client setup
  App.tsx
  main.tsx
```

## apps/api (Backend)

- **Framework:** Express + TypeScript
- **ORM:** Prisma (MySQL)
- **Responsibilities:** REST API, business logic, data access

### Source Structure

```
apps/api/src/
  routes/           # Express route handlers (grouped by resource)
  middleware/       # Auth, error handling, validation
  services/        # Business logic (called by routes)
  prisma/          # Schema, migrations, seed
  lib/             # Utility functions
  app.ts           # Express app setup
  server.ts        # Entry point
```

### Layering

Routes -> Services -> Prisma. Routes never access Prisma directly.

## packages/shared

Shared code imported by both `apps/web` and `apps/api`.

```
packages/shared/src/
  types/            # Shared TypeScript interfaces/types
  constants/        # Shared constants
  utils/            # Pure utility functions (no app-specific deps)
```

### Rules

- No framework-specific code (no React, no Express).
- No side effects. Pure types, constants, and functions only.
- If something is only used by one app, it stays in that app.

## Adding a New Feature

1. Define shared types in `packages/shared` if both apps need them.
2. Add API route + service in `apps/api`.
3. Add UI components + store in `apps/web`.
4. Write tests in each affected package.
