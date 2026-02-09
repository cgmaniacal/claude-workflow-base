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

## Schema Changes Checklist

- [ ] Update `schema.prisma`
- [ ] Run `prisma migrate dev --name <name>`
- [ ] Update shared types in `packages/shared` if API shape changes
- [ ] Update affected services in `apps/api`
- [ ] Update affected components in `apps/web`
- [ ] Add/update tests
