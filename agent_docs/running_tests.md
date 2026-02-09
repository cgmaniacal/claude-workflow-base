# Running Tests

## Framework

All tests use **Vitest**. Config lives in each app's `vitest.config.ts`.

## Commands

```bash
npm run test             # Run all tests once
npm run test:watch       # Watch mode (re-runs on file change)
```

Run tests for a single workspace:

```bash
npm run test --workspace=apps/web
npm run test --workspace=apps/api
```

## File Conventions

- Colocate tests next to source: `Button.tsx` -> `Button.test.tsx`
- Name pattern: `*.test.ts` or `*.test.tsx`
- Test utilities/helpers go in `__tests__/helpers/` within each app

## Writing Tests

### Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('functionName', () => {
  it('should describe expected behavior', () => {
    expect(result).toBe(expected);
  });
});
```

### React Components

Use `@testing-library/react` for component tests. Test behavior, not implementation.

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

### API Services (Unit Tests)

Test services in isolation by mocking Prisma. This is the most important backend test layer — services contain all business logic.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUser } from './user.service.js';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('createUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should create a user with valid input', async () => {
    const input = { email: 'test@example.com', name: 'Test User' };
    const expected = { id: 1, ...input, createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(prisma.user.create).mockResolvedValue(expected);

    const result = await createUser(input);

    expect(prisma.user.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(expected);
  });

  it('should throw on duplicate email', async () => {
    vi.mocked(prisma.user.create).mockRejectedValue(
      new Error('Unique constraint failed on the fields: (`email`)'),
    );

    await expect(createUser({ email: 'dup@example.com', name: 'Dup' }))
      .rejects.toThrow();
  });
});
```

### API Routes (Integration Tests)

Use `supertest` to test routes with the full middleware stack (validation, error handling, auth). These verify that routes, middleware, and services work together.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js');

describe('POST /api/v1/users', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return 201 with valid input', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 1, email: 'test@example.com', name: 'Test',
      createdAt: new Date(), updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'test@example.com', name: 'Test' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'not-an-email', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Test Levels for Backend

| Level | What it tests | Mocking | Speed |
|-------|--------------|---------|-------|
| **Service unit tests** | Business logic, error cases, edge cases | Mock Prisma | Fast |
| **Route integration tests** | HTTP status codes, validation, middleware, response shape | Mock Prisma | Fast |
| **Database integration tests** | Queries, migrations, constraints | Real test database | Slow |

Focus on service unit tests and route integration tests. Database integration tests are valuable but optional — Prisma's type safety catches most schema issues at compile time.

### Database Test Isolation

If writing tests against a real database, isolate test data with transactions:

```typescript
import { beforeEach } from 'vitest';
import { prisma } from '../lib/prisma.js';

beforeEach(async () => {
  // Clean tables in dependency order (children before parents)
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
});
```

Use a separate test database (e.g., `DATABASE_URL` in `.env.test`) — never run tests against the development database.

## Mocking

- Use `vi.mock()` for module-level mocks
- Use `vi.fn()` for function mocks
- Use `vi.mocked()` for type-safe mock access
- Mock external dependencies (DB, APIs), not internal logic
- Reset mocks between tests with `beforeEach(() => vi.clearAllMocks())`

## What to Test

- Business logic and utility functions: always
- Component rendering and user interactions: always
- API request/response contracts: always
- Service error handling and edge cases: always
- Validation schemas (valid + invalid inputs): always
- Styling, static markup, third-party library internals: never
