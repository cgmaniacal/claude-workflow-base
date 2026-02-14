# Database Schema

## ORM

This project uses **Prisma** with **PostgreSQL**.

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

- Table names: PascalCase singular in Prisma (`User`), maps to snake_case plural in PostgreSQL (`users`) via `@@map`.
- Column names: camelCase in Prisma, snake_case in PostgreSQL via `@map`.
- Every table has: `id` (auto-increment), `createdAt`, `updatedAt`.
- Use `@relation` explicitly — never rely on implicit relations.
- Add `@@index` for columns used in WHERE clauses or JOINs.

## Seeding

Seed script lives at `apps/api/src/prisma/seed.ts`.

- Use `upsert` to make seeds idempotent.
- Keep seed data minimal — just enough to develop against.

## Relation Cascade Behavior

Always specify `onDelete` and `onUpdate` explicitly on every relation. Prisma defaults are often not what you want.

| Scenario | `onDelete` | Example |
|----------|-----------|---------|
| Child is meaningless without parent | `Cascade` | `Comment` belongs to `Post` — delete post deletes comments |
| Child should survive parent deletion | `SetNull` | `Post` belongs to `User` — delete user sets `authorId` to null |
| Prevent deletion if children exist | `Restrict` | `Category` has `Product`s — block category deletion |

```prisma
model Comment {
  id     Int  @id @default(autoincrement())
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  postId Int  @map("post_id")

  @@map("comments")
}
```

## Soft Deletes

For data that may need to be recovered or audited, use soft deletes instead of hard `DELETE`:

- Add a `deletedAt DateTime?` field (null means active)
- Filter soft-deleted records in service queries: `where: { deletedAt: null }`
- Use Prisma middleware or a wrapper to apply this filter globally when appropriate

```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  deletedAt DateTime? @map("deleted_at")
  // ...
}
```

Not every model needs soft deletes — use them for user-facing data, audit-sensitive records, and anything with regulatory retention requirements. Ephemeral data (sessions, logs) can use hard deletes.

## Query Patterns

### Avoiding N+1 Queries

The most common ORM performance issue. Happens when you fetch a list, then query each item's relations individually.

```typescript
// Bad: N+1 — fetches users, then runs a query per user for posts
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
}

// Good: eager load relations in a single query
const users = await prisma.user.findMany({
  include: { posts: true },
});
```

**Rule:** Always use `include` for relations you know you need. Use `select` to limit fields when you don't need the full record.

### Transactions

Use `$transaction` when multiple writes must succeed or fail together:

```typescript
// Sequential transaction — operations run in order
const [order, payment] = await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.payment.create({ data: paymentData }),
]);

// Interactive transaction — use when logic depends on intermediate results
const result = await prisma.$transaction(async (tx) => {
  const account = await tx.account.findUniqueOrThrow({ where: { id: accountId } });
  if (account.balance < amount) throw new Error('Insufficient balance');
  return tx.account.update({
    where: { id: accountId },
    data: { balance: { decrement: amount } },
  });
});
```

**When to use transactions:**
- Creating related records together (order + line items)
- Transferring values between records (balance transfers)
- Any operation where partial completion would leave data inconsistent

### Select Only What You Need

For list endpoints and performance-sensitive queries, use `select` to limit returned fields:

```typescript
// Return only the fields the API response needs
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});
```

### Slow Query Detection

Use Prisma middleware to log queries that exceed a time threshold. This catches performance issues from the application's perspective (including connection wait time), not just database execution time.

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const SLOW_QUERY_MS = 500;

prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  if (duration > SLOW_QUERY_MS) {
    console.warn(`Slow query: ${params.model}.${params.action} took ${duration}ms`);
  }
  return result;
});
```

Adjust the threshold per project. In development, a lower threshold (e.g., 100ms) helps catch issues early.

## Example Model

```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String
  posts     Post[]
  deletedAt DateTime? @map("deleted_at")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

## PostgreSQL-Specific Conventions

### Data Types

PostgreSQL has richer native types than other databases. Use them via Prisma's `@db` attribute:

| Use case | Prisma type | PostgreSQL type | Notes |
|----------|-------------|-----------------|-------|
| Primary key (UUID) | `String @id @default(uuid())` | `uuid` | Use `@db.Uuid` for native UUID storage |
| Primary key (auto-increment) | `Int @id @default(autoincrement())` | `serial` | Default in examples; UUID preferred for public-facing IDs |
| JSON data | `Json` | `jsonb` | Use `@db.JsonB` — always JSONB, never JSON (JSONB is indexable and faster to query) |
| Arrays | `String[]`, `Int[]` | `text[]`, `integer[]` | Native array support — no junction table needed for simple lists |
| Enums | `enum Role { ADMIN USER }` | `CREATE TYPE` | Prisma creates native PostgreSQL enums |
| Text | `String` | `text` | No performance difference between `text` and `varchar(n)` in PostgreSQL — use `text` unless you need a DB-level length constraint |
| Timestamps | `DateTime` | `timestamptz` | Use `@db.Timestamptz` — always store with timezone |

```prisma
model Product {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  tags        String[]
  metadata    Json     @db.JsonB
  price       Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@map("products")
}
```

### Common Gotchas

**1. Connection pooling** — PostgreSQL has a default connection limit of 100. Prisma opens a pool per process. Set the pool size in the connection string to avoid hitting the limit, especially in development where multiple tools (API, Prisma Studio, migrations) may connect simultaneously:

```
DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/myapp_dev?connection_limit=5"
```

In production behind a serverless or multi-process setup, consider PgBouncer or Prisma Accelerate for connection pooling.

**2. Case sensitivity** — PostgreSQL lowercases all unquoted identifiers. Prisma handles this with `@@map`/`@map`, but if you write raw SQL queries (`$queryRaw`), always use quoted identifiers for camelCase column names:

```typescript
// Correct: quoted identifier
await prisma.$queryRaw`SELECT "createdAt" FROM users WHERE id = ${id}`;

// Wrong: PostgreSQL will look for "createdat"
await prisma.$queryRaw`SELECT createdAt FROM users WHERE id = ${id}`;
```

**3. Timezone handling** — PostgreSQL stores `timestamptz` in UTC and converts on retrieval based on the session timezone. Always use `@db.Timestamptz` (not `@db.Timestamp`) to ensure timezone awareness. Prisma returns JavaScript `Date` objects which are inherently UTC.

**4. Extensions** — PostgreSQL features like UUID generation (`uuid-ossp`, `pgcrypto`) or full-text search require enabling extensions. Prisma can't create extensions — use a migration:

```sql
-- In a Prisma migration file
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

Prisma's `@default(uuid())` uses `gen_random_uuid()` from `pgcrypto`, which PostgreSQL 13+ includes by default. No extension needed for basic UUID generation on PostgreSQL 13+.

**5. JSONB querying** — When you need to filter by fields inside a JSONB column, use Prisma's JSON filtering:

```typescript
const products = await prisma.product.findMany({
  where: {
    metadata: {
      path: ['category'],
      equals: 'electronics',
    },
  },
});
```

For complex JSONB queries beyond what Prisma supports, use `$queryRaw` with PostgreSQL's native JSONB operators (`->`, `->>`, `@>`, `?`).

**6. Full-text search** — PostgreSQL has built-in full-text search. For simple search needs, this eliminates the need for Elasticsearch or Algolia:

```typescript
// Raw query for full-text search
const results = await prisma.$queryRaw`
  SELECT id, name
  FROM products
  WHERE to_tsvector('english', name || ' ' || description)
    @@ plainto_tsquery('english', ${searchTerm})
`;
```

Add a GIN index on the tsvector for performance:

```sql
CREATE INDEX idx_products_search ON products
  USING GIN (to_tsvector('english', name || ' ' || description));
```

## Schema Changes Checklist

- [ ] Update `schema.prisma`
- [ ] Run `prisma migrate dev --name <name>`
- [ ] Update shared types in `packages/shared` if API shape changes
- [ ] Update affected services in `apps/api`
- [ ] Update affected components in `apps/web`
- [ ] Add/update tests
