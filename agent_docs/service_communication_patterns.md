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

## Validation

- **API side:** Validate request bodies in route handlers before passing to services. Use a schema validation library (e.g., Zod).
- **Frontend side:** Validate forms before submission. Share validation schemas from `packages/shared` when possible.

## Error Handling Flow

1. Service throws or returns error
2. Route handler catches and passes to error middleware
3. Error middleware formats response as `ApiError`
4. Frontend API client checks response, throws typed errors
5. UI component catches and displays to user
