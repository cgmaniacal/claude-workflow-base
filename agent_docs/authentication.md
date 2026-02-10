# Authentication

## When to Add Auth

Not every project needs authentication. Add it when the application has user-specific data, protected routes, or admin functionality. This doc defines the conventions to follow when you do.

## Architecture: Default-Deny Middleware

Use a **default-deny** pattern: a single middleware at the top of the stack that blocks every request unless the route is explicitly whitelisted as public. This inverts the typical per-route approach — new routes are protected by default, so you never accidentally expose an endpoint.

```typescript
// middleware/auth.ts
const PUBLIC_PATHS = new Set([
  '/api/v1/health',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
]);

const PUBLIC_PREFIXES = ['/api/docs'];

function isPublic(path: string): boolean {
  return PUBLIC_PATHS.has(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  if (isPublic(req.path)) return next();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing authentication' } });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = payload as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}
```

### Middleware Order

Auth middleware runs after security middleware, before route handlers:

```typescript
// app.ts
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(requestId);           // correlation ID
app.use(rateLimit({ ... }));
app.use(express.json({ limit: '10kb' }));
app.use(authenticate);        // default-deny auth
// ... route handlers
app.use(errorHandler);
```

## Libraries

| Library | Purpose |
|---------|---------|
| `jsonwebtoken` | JWT creation and verification |
| `bcryptjs` | Password hashing (pure JS, no native deps) |

## Token Strategy

### Access Tokens

- Short-lived (15 minutes)
- Stateless — payload contains user ID, email, roles
- Sent via `Authorization: Bearer <token>` header

```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken';

export function createAccessToken(user: { id: number; email: string; roles: string[] }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, roles: user.roles },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' },
  );
}
```

### Refresh Tokens

- Long-lived (7 days), stored in the database
- Used only to obtain a new access token
- Rotated on each use (old token invalidated, new one issued)
- Hashed before storage (never store raw refresh tokens)

```typescript
// In the auth service
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const hashed = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashed } });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
  }

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueTokenPair(stored.userId);
}
```

### Token Storage (Frontend)

Store tokens in **httpOnly cookies** when possible — they are not accessible to JavaScript, which prevents XSS from stealing tokens.

If httpOnly cookies are not practical (e.g., the API is on a different domain without proper CORS cookie support), use in-memory state (React context or Zustand) with a refresh token in an httpOnly cookie. Avoid `localStorage` for tokens — it is accessible to any script on the page.

## Password Hashing

- Use `bcryptjs` with a cost factor of at least 12
- Never store plaintext passwords
- Never log passwords, even during errors

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## Password Validation

Validate in the Zod schema at the route level:

```typescript
export const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
});
```

Minimum 8 characters. Maximum 128 (bcrypt has a 72-byte input limit, but capping at 128 prevents abuse). Do not enforce overly complex rules (uppercase + number + symbol) — length is the primary factor in password security.

## Role-Based Authorization

After authentication (who are you?), check authorization (what can you do?) in the service layer or via a middleware helper:

```typescript
// middleware/authorize.ts
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.some((role) => req.user.roles.includes(role))) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      return;
    }
    next();
  };
}

// Usage in routes
router.delete('/:id', requireRole('admin'), async (req, res, next) => { ... });
```

## Integration with Existing Patterns

Auth fits into the existing error handling and service architecture:

- **Auth errors** use the existing `AppError` class: `throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401)`
- **Error codes** `UNAUTHORIZED` and `FORBIDDEN` are already defined in the standard error codes (`service_communication_patterns.md`)
- **Services remain stateless** — pass the authenticated user as a parameter, not via `req`:

```typescript
// Good: user passed as argument
export function getUserProfile(userId: number, requestingUser: AuthUser): Promise<UserProfile> { ... }

// Bad: service reads from req
export function getUserProfile(req: Request): Promise<UserProfile> { ... }
```

## Environment Variables

Auth adds these required env vars:

```
JWT_SECRET=           # Random string, min 32 chars, generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_EXPIRY=15m        # Access token lifetime
REFRESH_EXPIRY=7d     # Refresh token lifetime
```

Validate at startup alongside other required vars (see `service_architecture.md`).

## Auth Routes

Standard auth endpoints follow the existing API conventions (`/api/v1/` prefix, standard error codes):

| Method | Route | Description | Public |
|--------|-------|-------------|--------|
| POST | `/api/v1/auth/register` | Create account | Yes |
| POST | `/api/v1/auth/login` | Get tokens | Yes |
| POST | `/api/v1/auth/refresh` | Rotate tokens | Yes |
| POST | `/api/v1/auth/logout` | Revoke refresh token | No |
| GET | `/api/v1/auth/me` | Get current user | No |

## Rate Limiting for Auth

Apply stricter rate limits to auth endpoints to prevent brute-force attacks:

```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // much stricter than the default 100
});

router.use('/auth/login', authLimiter);
router.use('/auth/register', authLimiter);
```
