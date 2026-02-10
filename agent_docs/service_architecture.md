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

### Service Layer Conventions

Services contain all business logic. They are the only layer that calls Prisma.

- **Stateless** — services are pure functions or classes with no request-scoped state. They receive all inputs as arguments.
- **No `req`/`res` access** — services never import or reference Express types. They accept typed parameters and return typed results. This keeps them testable without HTTP.
- **Throw domain errors, not HTTP errors** — services throw descriptive errors (`UserNotFoundError`, `DuplicateEmailError`). Route handlers catch these and translate to HTTP status codes. See `service_communication_patterns.md` for error classification.
- **One service per resource** — `userService.ts`, `postService.ts`, etc. If a service file exceeds 200 lines, split by sub-domain.

```typescript
// Good: service accepts typed params, returns typed result
export function createUser(data: CreateUserInput): Promise<User> { ... }

// Bad: service accepts Express req
export function createUser(req: Request): Promise<User> { ... }
```

### Security Defaults

These middleware should be configured in `app.ts` for every full-stack project:

| Middleware | Purpose | Package |
|-----------|---------|---------|
| **Helmet** | Sets security headers (CSP, HSTS, X-Frame-Options, etc.) | `helmet` |
| **CORS** | Controls which origins can access the API | `cors` |
| **Rate limiting** | Prevents abuse and brute-force attacks | `express-rate-limit` |

```typescript
// app.ts setup order
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10kb' })); // prevent large payload attacks
```

### Request Correlation IDs

Every request should carry a unique ID for tracing errors from client reports to server logs. Add this middleware early in the stack (before route handlers):

```typescript
// middleware/requestId.ts
import { randomUUID } from 'node:crypto';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers['x-request-id'] as string || randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}
```

Include the request ID in error responses so users can report it:

```typescript
// In errorHandler.ts — for unknown errors
res.status(500).json({
  error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId: req.id },
});
```

And in all log output so you can search by ID:

```typescript
console.error(`[${req.id}] Unhandled error:`, err);
```

### Environment Variables

- All secrets and environment-specific values go in `.env` (never committed)
- `.env.example` is the contract — lists every variable with placeholder values, committed to git
- Access via `process.env.VARIABLE_NAME`
- Validate required env vars at startup (fail fast if missing):

```typescript
// app.ts or config.ts
const required = ['DATABASE_URL', 'CORS_ORIGIN'] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```

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
