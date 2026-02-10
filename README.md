# claude-workflow-base

A boilerplate for building React applications with Claude Code. Supports both frontend-only and full-stack configurations.

## Prerequisites

- **Node.js 22** (LTS) — install via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22`
- **npm** (ships with Node)
- **Docker Desktop** (full stack only) — provides MySQL via Docker Compose, no local MySQL installation needed

## Getting Started

1. Clone this repo into a new project directory:

```bash
git clone https://github.com/cgmaniacal/claude-workflow-base.git my-project
cd my-project
```

2. Run the setup command:

```bash
npm run setup
```

This will prompt you to select either:
- **Frontend only** — React SPA with Vite, TailwindCSS, and SASS. No backend or database.
- **Full stack** — React SPA + Express API + shared types package + Prisma (MySQL).

**What setup does:**
- Scaffolds the full project structure (apps, packages, configs)
- Detects the directory name and uses it as the project name
- Generates CI pipeline (`.github/workflows/ci.yml`)
- Generates `docker-compose.yml` with MySQL (full stack only)
- Installs all dependencies
- Initializes the Claude memory tree
- Removes backend-specific docs if frontend-only
- Cleans up the setup scripts (self-deletes `scripts/`)
- Commits the scaffolded project

## Tech Stack

| Layer | Technology | Required |
|-------|-----------|----------|
| Monorepo | Turborepo, npm workspaces | Always |
| Frontend | React, TypeScript, Vite, TailwindCSS, SASS, Zustand | Always |
| Backend | Express, TypeScript | Full stack only |
| Database | MySQL, Prisma ORM | Full stack only |
| Local DB | Docker Compose (MySQL container) | Full stack only |
| Testing | Vitest | Always |
| Linting | ESLint (flat config) + Prettier | Always |
| CI | GitHub Actions | Always |
| Dependency updates | Renovate | Always |
| Runtime | Node 22 (LTS) | Always |

## Architecture

### Frontend Only

```
apps/
  web/              # React SPA (Vite)
agent_docs/          # Claude task-specific instructions
docs/
  research/          # Research and brainstorming docs
  plans/             # Implementation plans
  decisions/         # Architectural Decision Records
```

A single React application built with Vite. State managed with Zustand. Styled with TailwindCSS utilities and SASS modules. Suitable for static sites, landing pages, or SPAs that consume external APIs.

### Full Stack

```
apps/
  web/              # React SPA (Vite)
  api/              # Express API server
packages/
  shared/           # Shared types, utils, constants
agent_docs/          # Claude task-specific instructions
docs/
  research/          # Research and brainstorming docs
  plans/             # Implementation plans
  decisions/         # Architectural Decision Records
```

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
              │  types, utils │
              └───────────────┘
```

The API follows a layered pattern: **Routes -> Services -> Prisma**. Shared types and utilities live in `packages/shared` so both apps stay in sync. See `agent_docs/service_architecture.md` for details.

## Development

### Full Stack: Start the Database

Full-stack projects use Docker Compose for MySQL. Start the database before running the app:

```bash
docker compose up -d db    # Start MySQL in background
npm run dev                # Start API + web via Turbo
```

To stop the database: `docker compose down` (data persists in a named volume). To reset: `docker compose down -v`.

### Commands

```bash
npm run dev          # Start all apps
npm run build        # Build all apps
npm run lint         # Lint + format check
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

### Git Conventions

- **Branch per feature:** `feature/<short-description>` (e.g., `feature/add-login-form`)
- **Commit format:** [Conventional Commits](https://www.conventionalcommits.org/) — `type(scope): description`
- **Commit timing:** Implement and Validate phases only

See `CLAUDE.md` for the full Git workflow.

### Code Conventions

- TypeScript strict mode, no `any`
- Small files (<200 lines), one component/module per file
- Colocated tests (`foo.ts` -> `foo.test.ts`)
- Named exports over default exports
- Path aliases: `@web/`, `@api/`, `@shared/`

See `agent_docs/code_conventions.md` for the complete guide.

### Frontend Quality Standards

All user-facing features target:
- **Accessibility:** WCAG 2.1 AA compliance (semantic HTML, keyboard navigation, screen reader support, 4.5:1 contrast)
- **Responsive design:** Mobile-first, works from 320px to 1920px+
- **Performance:** Lighthouse 90+ across all categories
- **SEO:** Unique titles, meta descriptions, semantic headings (public-facing sites only)

See `agent_docs/frontend_quality.md` for the full checklist.

### Backend and Database Standards (Full Stack)

All API and database code follows these conventions:
- **Security:** Helmet, CORS, rate limiting, request size limits, and request correlation IDs configured by default. Secrets in `.env` only, validated at startup.
- **Authentication:** Default-deny middleware pattern — all routes protected unless explicitly whitelisted. JWT access/refresh tokens, bcrypt password hashing. See `agent_docs/authentication.md`.
- **Service layer:** Stateless, no `req`/`res` access, throw domain errors (not HTTP errors). One service per resource.
- **Input validation:** All request bodies validated with Zod at the route handler level before reaching services. Strings trimmed and bounded.
- **Error handling:** Errors classified (validation, domain, auth, internal) with standard codes. Internal details never leaked to clients. Correlation IDs in all error responses.
- **Database:** Docker Compose for local MySQL. Explicit cascade behavior on every relation. N+1 avoidance via `include`/`select`. Transactions for multi-step writes. Slow query detection. Soft deletes for audit-sensitive data.

See `agent_docs/service_architecture.md`, `agent_docs/database_schema.md`, `agent_docs/service_communication_patterns.md`, and `agent_docs/authentication.md` for details.

## CI/CD

### GitHub Actions

The CI pipeline (`.github/workflows/ci.yml`, generated by setup) runs three parallel jobs on every push to `main` and every pull request:

1. **Lint** — ESLint + Prettier check
2. **Test** — Vitest test suite
3. **Build** — Production build

### Dependency Updates

[Renovate](https://docs.renovatebot.com/) is configured in `renovate.json` to keep dependencies current:

| Update type | Behavior |
|-------------|----------|
| Patch | Grouped, auto-merged if CI passes |
| Minor | Grouped, manual review |
| Major | Individual PRs, manual review |
| Dev dependencies | Grouped, auto-merged if CI passes |

Related packages (React, Prisma, linting tools) are updated together to prevent version mismatches. See `agent_docs/dependency_updates.md` for the review process.

## Claude Code Workflow

This project is designed for development with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and the [Superpowers](https://github.com/obra/superpowers) plugin.

### Setup

Install the Superpowers plugin:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### Workflow Phases

| Phase | Superpowers skill | Output |
|-------|------------------|--------|
| Research | `brainstorming` | Design doc in `docs/research/`, ADR in `docs/decisions/` |
| Plan | `writing-plans` | Implementation plan in `docs/plans/` |
| Implement | `executing-plans`, `test-driven-development` | Working code with tests |
| Validate | `verification-before-completion`, `finishing-a-development-branch` | Passing lint/tests/build, merge or PR |

### Architectural Decision Records

Significant architectural decisions are recorded in `docs/decisions/` using a lightweight ADR format. ADRs capture the *why* behind decisions so future developers (and Claude sessions) can evaluate whether a decision still holds. See `docs/decisions/000-template.md` for the format.

### Persistent Memory

Claude maintains a hierarchical memory tree at `.claude/memory/` that persists across sessions. Context is managed automatically via hooks — no manual setup required.

**Automatic behaviors:**

| Event | What happens |
|-------|-------------|
| Session starts | Loads last session summary, preferences, recent decisions, active plans |
| Every ~15 messages | Nudges `/remember` to capture key context before it falls out of the window |
| Before compaction | Saves structured state (active plan progress, session notes) |
| After compaction | Re-injects saved state so work can continue seamlessly |
| Each session | Updates a project file index in the background |

**Commands:**

| Command | Description |
|---------|-------------|
| `/remember` | Extract and save decisions, patterns, bugs, and preferences from the conversation |
| `/recall [topic]` | Search the memory tree for context on a specific topic |
| `/memory-status` | Show stored memory count by domain |

Memory is organized into domains: `decisions/`, `patterns/`, `bugs/`, `preferences/`, `context/`, `sessions/`, `research/`, `plans/`, and `files/`. Each domain contains markdown files with a standard format. See `agent_docs/memory_system.md` for the full architecture.

### Additional Resources

| Resource | Description |
|----------|-------------|
| `agent_docs/` | Task-specific instructions loaded by Claude on demand (progressive disclosure) |
| `CLAUDE.md` | Developer guide — tech stack, workflow, git conventions, commands, coding standards |
| `.claude/settings.json` | Pre-approved commands and hook configuration |
| `renovate.json` | Dependency update automation configuration |
| `docs/decisions/` | Architectural Decision Records |
