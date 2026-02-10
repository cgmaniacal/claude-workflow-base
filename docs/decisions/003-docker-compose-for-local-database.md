# Use Docker Compose for Local Database

**Status:** accepted
**Date:** 2026-02-10
**Deciders:** Project maintainer

## Context

Full-stack projects require MySQL for local development. Previously, the boilerplate assumed developers would install MySQL natively on their machine. This creates several issues:

- MySQL installation varies by OS (Homebrew on macOS, apt on Linux, installer on Windows)
- Version mismatches between developers cause subtle bugs
- Database creation, user setup, and password configuration is manual and error-prone
- Developers must manage a system-wide MySQL process alongside other projects

The alternative approaches considered:
1. **Native MySQL installation** (previous approach) — simplest, but fragile and OS-dependent
2. **Docker Compose for database only** — containerized DB, native Node.js apps
3. **Full Docker Compose** (all services containerized) — maximum isolation, but slower dev cycle (no HMR, rebuild on changes)
4. **Cloud-hosted dev database** — zero local setup, but requires internet and incurs cost

## Decision

Use Docker Compose to containerize **only the database** for local development. The API and web apps continue to run natively via `npm run dev` (Turbo).

The setup script generates a `docker-compose.yml` with:
- MySQL 8 container with health check
- Project-specific database name derived from the directory name
- Pre-configured credentials matching the generated `.env` file
- Named volume for data persistence across container restarts

Development workflow becomes: `docker compose up -d db` then `npm run dev`.

## Consequences

### Positive

- Zero MySQL installation required — Docker Desktop is the only prerequisite
- Every developer gets an identical database version and configuration
- Database credentials are pre-configured to match `.env` — works out of the box
- Named volume persists data across restarts; `docker compose down -v` for a clean reset
- No conflict with other projects' databases (isolated container)

### Negative

- Docker Desktop is now a prerequisite for full-stack projects (~2GB install)
- Developers unfamiliar with Docker have a small learning curve
- Container startup adds a few seconds before `npm run dev` can connect

### Neutral

- Frontend-only projects are unaffected (no Docker Compose generated)
- CI continues to work without Docker (tests mock Prisma, no real database needed)
- Production database hosting is a separate concern (not addressed by this decision)
