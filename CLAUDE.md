# CLAUDE.md

## Tech Stack

| Layer | Technology | Required |
|-------|-----------|----------|
| Monorepo | Turborepo, npm workspaces | Always |
| Frontend | React, TypeScript, Vite, TailwindCSS, SASS, Zustand | Always |
| Backend | Express, TypeScript | Optional |
| Database | PostgreSQL, Prisma ORM | Optional |
| Local DB | Docker Compose (PostgreSQL container) | Optional |
| Testing | Vitest | Always |
| Linting | ESLint + Prettier | Always |
| CI | GitHub Actions (lint, test, build) | Always |
| Runtime | Node (latest LTS) | Always |

This boilerplate supports two project scales:
- **Frontend only** — `apps/web` only. No API, no database.
- **Full stack** — `apps/web` + `apps/api` + `packages/shared` + PostgreSQL.

When starting a new project from this boilerplate, decide which scale applies and omit what isn't needed.

## Project Structure

```
apps/
  web/            # React SPA (Vite) — always present
  api/            # Express API server — full stack only
packages/
  shared/         # Shared types, utils, constants — full stack only
agent_docs/       # Task-specific instructions (see below)
docs/
  research/       # Research and brainstorming docs (Superpowers output)
  plans/          # Implementation plans (Superpowers output)
  decisions/      # Architectural Decision Records (ADRs)
.github/workflows/ # CI pipeline (lint, test, build)
```

## Workflow

This project uses the [Superpowers](https://github.com/obra/superpowers) plugin. Every task follows four phases — Superpowers skills handle the process. Do not skip phases.

1. **Research** — Use `superpowers:brainstorming`. Read `agent_docs/`, explore the codebase, ask clarifying questions. Design doc saved to `docs/research/`. Create an ADR in `docs/decisions/` for any decision with meaningful alternatives.
2. **Plan** — Use `superpowers:writing-plans`. Break work into small tasks with exact file paths and code. Plan saved to `docs/plans/`.
3. **Implement** — Use `superpowers:executing-plans` or `superpowers:subagent-driven-development`. Follow TDD (`superpowers:test-driven-development`). Commit after completing implementation.
4. **Validate** — Use `superpowers:verification-before-completion`. Evidence before claims. All lint, tests, and build must pass. CI runs automatically on PRs. Use `superpowers:finishing-a-development-branch` to merge or PR.

## Model Routing

When spawning subagents (Task tool), select the model by task complexity:

| Task type | Model | Examples |
|-----------|-------|---------|
| Research, architecture, complex analysis | `opus` | Brainstorming, design review, debugging complex issues |
| Code implementation | `sonnet` | Writing features, tests, refactors from a plan |
| File search, lookups, simple commands | `haiku` | Grep/glob exploration, running lint/build/test |

**Rule:** Default to `sonnet` for subagents. Escalate to `opus` only when the task requires cross-cutting reasoning or architectural judgment. Use `haiku` for read-only exploration and command execution.

The main conversation model is user-controlled (`/model` to switch). Use Opus for Research and Plan phases, Sonnet for Implement and Validate.

## Git

- **Branch per feature:** `feature/<short-description>` (e.g., `feature/add-login-form`)
- **Commits at:** Implement and Validate phases only. Research/plan artifacts belong in PR descriptions, not commits.
- **Commit format:** [Conventional Commits](https://www.conventionalcommits.org/) — `type(scope): description`
  - Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`
  - Scope = app or package name: `web`, `api`, `shared`
  - Example: `feat(web): add user login form`
- **Branch lifecycle:** Create branch before Implement. Merge to `main` after Validate passes.

## Commands

```bash
npm run dev          # Start all apps (turbo)
npm run build        # Build all apps
npm run lint         # Lint + format check
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

## Conventions (Quick Reference)

- TypeScript strict mode. No `any`.
- Small files (<200 lines). One component/module per file.
- Colocate tests: `foo.ts` -> `foo.test.ts`
- Named exports over default exports.
- Path aliases: `@web/`, `@api/`, `@shared/`

For full conventions, see `agent_docs/code_conventions.md`.

## Agent Docs (Progressive Disclosure)

Before starting a task, consult the relevant doc in `agent_docs/`:

| Doc | When to read |
|-----|-------------|
| `building_the_project.md` | Build setup, scripts, env config |
| `running_tests.md` | Writing or running tests |
| `code_conventions.md` | Any code change |
| `service_architecture.md` | Adding/modifying services or packages |
| `database_schema.md` | Schema changes, migrations, seeding |
| `service_communication_patterns.md` | API contracts, request/response patterns |
| `frontend_quality.md` | Accessibility, responsive design, performance, SEO |
| `image_optimization.md` | Responsive variants, ThumbHash placeholders, upload processing |
| `authentication.md` | Adding auth (JWT, middleware, roles, token strategy) |
| `dependency_updates.md` | Reviewing Renovate PRs, adding/updating dependencies |
| `memory_system.md` | Memory architecture, commands, entry format, rules |

## Memory

Persistent memory at `.claude/memory/` is managed automatically via hooks. Commands:

| Command | What it does |
|---------|-------------|
| `/remember` | Extract and save context from the current conversation |
| `/recall [topic]` | Search memory tree for relevant context |
| `/memory-status` | Show stored memory count by domain |

See `agent_docs/memory_system.md` for architecture and hook details.
