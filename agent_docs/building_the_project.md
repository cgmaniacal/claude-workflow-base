# Building the Project

## Prerequisites

- Node.js (latest LTS)
- npm (comes with Node)
- Docker Desktop (provides PostgreSQL via Docker Compose) — **full-stack projects only**

## Monorepo Setup

This project uses **Turborepo** with **npm workspaces**.

```
Root package.json defines workspaces:
  - apps/*
  - packages/*
```

## Environment Variables

Each app has its own `.env` file. Never commit `.env` files.

```
apps/web/.env          # VITE_* prefixed variables only
apps/api/.env          # DB connection, secrets, port config
```

A `.env.example` in each app documents required variables.

## Database (Full Stack)

Full-stack projects use Docker Compose for a local PostgreSQL instance. Start the database before running the app:

```bash
docker compose up -d db    # Start PostgreSQL in background
docker compose down        # Stop (data persists in named volume)
docker compose down -v     # Stop and reset all data
```

The generated `.env` files already point to the Docker PostgreSQL instance.

## Scripts

All scripts run from the **repo root** via Turborepo:

```bash
npm run dev            # Start all apps in dev mode (parallel)
npm run build          # Build all apps (respects dependency order)
npm run lint           # Lint + format check across all packages
npm run test           # Run all tests
```

App-specific scripts can be run with:

```bash
npm run dev --workspace=apps/web
npm run dev --workspace=apps/api
```

## Build Order

Turborepo handles the dependency graph:

1. `packages/shared` builds first (other packages depend on it)
2. `apps/api` and `apps/web` build in parallel

## Adding a New Package

1. Create directory under `packages/` or `apps/`
2. Add a `package.json` with the workspace name (e.g., `@repo/new-pkg`)
3. Add it as a dependency where needed: `"@repo/new-pkg": "*"`
4. Run `npm install` from the root to link it

## Path Aliases

| Alias | Maps to |
|-------|---------|
| `@web/*` | `apps/web/src/*` |
| `@api/*` | `apps/api/src/*` |
| `@shared/*` | `packages/shared/src/*` |

Aliases are configured in each app's `tsconfig.json` and Vite/bundler config.
