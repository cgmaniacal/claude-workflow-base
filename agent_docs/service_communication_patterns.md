# Service Communication Patterns

## Overview

`apps/web` communicates with `apps/api` via **JSON over HTTP**. All contracts are typed in `packages/shared`.

## API Design

- RESTful resource-based routes.
- Base path: `/api/v1/`
- Resources are plural: `/api/v1/users`, `/api/v1/posts`

## Request/Response Shape

### Success Response

```typescript
// packages/shared/src/types/api.ts
interface ApiResponse<T> {
  data: T;
}
```

### Error Response

```typescript
interface ApiError {
  error: {
    code: string;        // Machine-readable: "NOT_FOUND", "VALIDATION_ERROR"
    message: string;     // Human-readable description
  };
}
```

### Paginated Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

## HTTP Conventions

| Action | Method | Route Pattern | Success Code |
|--------|--------|--------------|-------------|
| List | GET | `/resources` | 200 |
| Get one | GET | `/resources/:id` | 200 |
| Create | POST | `/resources` | 201 |
| Update | PATCH | `/resources/:id` | 200 |
| Delete | DELETE | `/resources/:id` | 204 |

## Frontend API Client

Centralize all API calls in feature-specific files:

```
features/users/users.api.ts
features/posts/posts.api.ts
```

Use a shared base client (e.g., wrapper around `fetch`) configured in `lib/apiClient.ts` for:
- Base URL
- Auth headers
- Error handling

## Validation with Zod

All request input is validated at the route handler level using [Zod](https://zod.dev/) schemas before data reaches services.

### Schema Location

```
apps/api/src/
  routes/
    users.ts              # Route handlers
  schemas/
    users.schema.ts       # Zod schemas for user routes
packages/shared/src/
  schemas/
    users.schema.ts       # Schemas shared between frontend and API
```

**Rule:** If a validation schema is only used server-side (e.g., includes database-specific constraints), keep it in `apps/api/src/schemas/`. If the frontend also needs it (e.g., form validation), put it in `packages/shared/src/schemas/`.

### Schema Pattern

```typescript
// apps/api/src/schemas/users.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().min(1).max(100).trim(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

### Route Handler Validation

Validate early, before calling the service:

```typescript
// apps/api/src/routes/users.ts
import { createUserSchema } from '../schemas/users.schema.js';

router.post('/', async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await userService.create(data);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
});
```

### Input Sanitization

Apply these transformations in Zod schemas:
- `.trim()` on all string inputs
- `.toLowerCase()` on emails
- `.max()` on all strings to prevent storage abuse
- Do not trust client-sent IDs for authorization — always verify ownership in the service layer

## Error Handling

### Error Classification

| Type | Cause | What to return | What to log |
|------|-------|---------------|-------------|
| **Validation error** | Bad input from client | Field-level details | Nothing (client's problem) |
| **Domain error** | Business rule violation (duplicate email, insufficient balance) | Error code + message | Optional |
| **Not found** | Resource doesn't exist | 404 + code | Nothing |
| **Auth error** | Missing/invalid credentials or insufficient permissions | 401 or 403 + code | Log the attempt |
| **Internal error** | Bug, database failure, unhandled exception | Generic "Internal Server Error" | Full stack trace |

**Critical rule:** Never return internal details (stack traces, SQL queries, file paths) to the client. Log them server-side, return a generic message.

### Standard Error Codes

Use these machine-readable codes consistently across all routes:

```typescript
// packages/shared/src/types/errors.ts
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',           // e.g., duplicate email
  UNAUTHORIZED: 'UNAUTHORIZED',    // not authenticated
  FORBIDDEN: 'FORBIDDEN',          // authenticated but not authorized
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

### Domain Errors

Services throw typed domain errors. Route handlers or error middleware translate to HTTP:

```typescript
// apps/api/src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
  }
}

// Usage in a service
throw new AppError('CONFLICT', 'A user with this email already exists', 409);
```

### Error Middleware

The centralized error handler in `middleware/errorHandler.ts` translates all errors to the `ApiError` shape:

```typescript
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: err.flatten() },
    });
    return;
  }

  // Known domain errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Unknown errors — log full details, return generic message
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
```

### Error Handling Flow

1. Route handler validates input with Zod (throws `ZodError` if invalid)
2. Service executes business logic, throws `AppError` for domain violations
3. Route handler catches and passes to `next(err)`
4. Error middleware classifies the error and formats the `ApiError` response
5. Frontend API client checks response status, throws typed errors
6. UI component catches and displays user-facing message
