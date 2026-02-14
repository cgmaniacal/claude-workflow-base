# Use PostgreSQL Over MySQL

**Status:** accepted
**Date:** 2026-02-10
**Deciders:** Project maintainer
**Supersedes:** MySQL references in ADR-003

## Context

The boilerplate originally used MySQL as the default database for full-stack projects. After evaluating the tech stack holistically — particularly the Prisma ORM integration, TypeScript ecosystem, and the kinds of data structures modern web apps typically need — we reconsidered whether MySQL was the strongest default.

Alternatives evaluated:

1. **MySQL 8+** (previous default) — widely known, simple mental model, massive hosting ecosystem
2. **PostgreSQL 16** — richer type system, stronger Prisma integration, JSONB, native arrays/enums/UUIDs
3. **MariaDB** — MySQL fork, some improvements, but Prisma treats it as a separate provider with edge cases
4. **MongoDB** — document store, schema-flexible, but fundamentally misaligned with the relational patterns Prisma is designed for
5. **SQLite** — zero-config, but single-writer limitation makes it unsuitable for concurrent users

## Decision

Use **PostgreSQL** as the default database for full-stack projects.

## Consequences

### Positive

- **Prisma alignment** — PostgreSQL is Prisma's strongest integration. Native support for JSONB (`@db.JsonB`), arrays (`String[]`), enums, and UUIDs without workarounds.
- **Data types** — Native JSONB with indexing eliminates the need for separate key-value stores in many cases. Native arrays eliminate junction tables for simple lists. `timestamptz` handles timezones correctly by default.
- **Query capabilities** — CTEs, window functions, full-text search (`tsvector`/`tsquery`), and JSONB operators available when Prisma's query builder isn't sufficient.
- **Strictness** — PostgreSQL defaults to strict, correct behavior. No silent data truncation, no implicit type coercion, no encoding surprises (`utf8mb4`).
- **Hosting parity** — In 2026, managed PostgreSQL is available everywhere MySQL is (AWS RDS, Railway, Render, Neon, Supabase, Vercel Postgres).
- **Docker Compose setup is identical** — same complexity as the MySQL configuration (image name + env vars + healthcheck).

### Negative

- Developers with only MySQL experience have a small learning curve (mitigated: Prisma abstracts most SQL differences)
- Some legacy tutorials and examples assume MySQL (decreasingly relevant)

### Neutral

- The Docker Compose approach (ADR-003) is unchanged — only the image and connection string differ
- Frontend-only projects remain unaffected
- CI pipeline is unchanged (tests mock Prisma, no real database)
