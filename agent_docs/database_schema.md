# Database Schema

## ORM

This project uses **Prisma** with **MySQL**.

## Schema Location

```
apps/api/src/prisma/schema.prisma
```

## Commands

Run from `apps/api/`:

```bash
npx prisma migrate dev          # Create + apply migration (dev)
npx prisma migrate deploy       # Apply pending migrations (prod)
npx prisma generate             # Regenerate Prisma Client
npx prisma db seed              # Run seed script
npx prisma studio               # Visual data browser
```

## Migration Workflow

1. Edit `schema.prisma`
2. Run `npx prisma migrate dev --name descriptive-name`
3. Review the generated SQL in `prisma/migrations/`
4. Commit the migration files alongside the schema change

## Conventions

- Table names: PascalCase singular in Prisma (`User`), maps to snake_case plural in MySQL (`users`) via `@@map`.
- Column names: camelCase in Prisma, snake_case in MySQL via `@map`.
- Every table has: `id` (auto-increment), `createdAt`, `updatedAt`.
- Use `@relation` explicitly — never rely on implicit relations.
- Add `@@index` for columns used in WHERE clauses or JOINs.

## Seeding

Seed script lives at `apps/api/src/prisma/seed.ts`.

- Use `upsert` to make seeds idempotent.
- Keep seed data minimal — just enough to develop against.

## Example Model

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  posts     Post[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

## Schema Changes Checklist

- [ ] Update `schema.prisma`
- [ ] Run `prisma migrate dev --name <name>`
- [ ] Update shared types in `packages/shared` if API shape changes
- [ ] Update affected services in `apps/api`
- [ ] Update affected components in `apps/web`
- [ ] Add/update tests
