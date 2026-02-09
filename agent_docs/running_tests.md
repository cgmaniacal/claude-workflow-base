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

### API Routes

Test Express handlers by importing them directly. Use `supertest` for integration tests that need the full middleware stack.

## Mocking

- Use `vi.mock()` for module-level mocks
- Use `vi.fn()` for function mocks
- Mock external dependencies (DB, APIs), not internal logic
- Reset mocks between tests with `beforeEach(() => vi.clearAllMocks())`

## What to Test

- Business logic and utility functions: always
- Component rendering and user interactions: always
- API request/response contracts: always
- Styling, static markup, third-party library internals: never
