# claude-workflow-base

A boilerplate for building React applications with Claude Code. Supports both frontend-only and full-stack configurations.

## Getting Started

1. Clone this repo into a new project directory
2. Run the setup command to choose your project scale:

```bash
npm run setup
```

This will prompt you to select either:
- **Frontend only** — Sets up `apps/web` with React, Vite, TailwindCSS, and SASS. No backend or database.
- **Full stack** — Sets up `apps/web` + `apps/api` (Express) + `packages/shared` + Prisma (MySQL).

The setup command removes unused boilerplate so your project starts clean.

## Tech Stack

| Layer | Technology | Required |
|-------|-----------|----------|
| Monorepo | Turborepo, npm workspaces | Always |
| Frontend | React, TypeScript, Vite, TailwindCSS, SASS, Zustand | Always |
| Backend | Express, TypeScript | Full stack only |
| Database | MySQL, Prisma ORM | Full stack only |
| Testing | Vitest | Always |
| Linting | ESLint + Prettier | Always |
| Runtime | Node (latest LTS) | Always |

## Architecture

### Frontend Only

```
apps/
  web/              # React SPA (Vite)
agent_docs/          # Claude task-specific instructions
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

```bash
npm run dev          # Start all apps
npm run build        # Build all apps
npm run lint         # Lint + format check
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

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
| Research | `brainstorming` | Design doc in `docs/plans/` |
| Plan | `writing-plans` | Implementation plan in `docs/plans/` |
| Implement | `executing-plans`, `test-driven-development` | Working code with tests |
| Validate | `verification-before-completion`, `finishing-a-development-branch` | Passing lint/tests/build, merge or PR |

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

- `agent_docs/` — Task-specific instructions loaded by Claude on demand (progressive disclosure)
- `.claude/settings.json` — Pre-approved commands and hooks
- `CLAUDE.md` — Full developer guide
