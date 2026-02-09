# CLAUDE.md

## Tech Stack

| Layer | Technology | Required |
|-------|-----------|----------|
| Monorepo | Turborepo, npm workspaces | Always |
| Frontend | React, TypeScript, Vite, TailwindCSS, SASS, Zustand | Always |
| Backend | Express, TypeScript | Optional |
| Database | MySQL, Prisma ORM | Optional |
| Testing | Vitest | Always |
| Linting | ESLint + Prettier | Always |
| Runtime | Node (latest LTS) | Always |

This boilerplate supports two project scales:
- **Frontend only** — `apps/web` only. No API, no database.
- **Full stack** — `apps/web` + `apps/api` + `packages/shared` + MySQL.

When starting a new project from this boilerplate, decide which scale applies and omit what isn't needed.

## Project Structure

```
apps/
  web/            # React SPA (Vite) — always present
  api/            # Express API server — full stack only
packages/
  shared/         # Shared types, utils, constants — full stack only
agent_docs/       # Task-specific instructions (see below)
docs/plans/       # Design docs and implementation plans (Superpowers output)
```

## Workflow

This project uses the [Superpowers](https://github.com/obra/superpowers) plugin. Every task follows four phases — Superpowers skills handle the process. Do not skip phases.

1. **Research** — Use `superpowers:brainstorming`. Read `agent_docs/`, explore the codebase, ask clarifying questions. Design doc saved to `docs/plans/`.
2. **Plan** — Use `superpowers:writing-plans`. Break work into small tasks with exact file paths and code. Plan saved to `docs/plans/`.
3. **Implement** — Use `superpowers:executing-plans` or `superpowers:subagent-driven-development`. Follow TDD (`superpowers:test-driven-development`). Commit after completing implementation.
4. **Validate** — Use `superpowers:verification-before-completion`. Evidence before claims. All lint, tests, and build must pass. Use `superpowers:finishing-a-development-branch` to merge or PR.

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
| `memory_system.md` | Memory architecture, commands, entry format, rules |

## Memory

Persistent memory lives at `.claude/memory/` — a hierarchical tree of markdown files organized by domain. Hooks handle context automatically:

- **Session start**: auto-loads last session summary, preferences, recent decisions
- **Every ~15 messages**: nudges `/remember` to persist key context
- **Compaction**: saves state before, re-injects after

| Command | What it does |
|---------|-------------|
| `/remember` | Extract and save context from the current conversation |
| `/recall [topic]` | Search memory tree for relevant context |
| `/memory-status` | Show stored memory count by domain |

For full details, see `agent_docs/memory_system.md`.
