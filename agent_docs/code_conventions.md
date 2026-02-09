# Code Conventions

## TypeScript

- **Strict mode** enabled in all `tsconfig.json` files.
- Never use `any`. Use `unknown` + type narrowing when the type is truly dynamic.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Use explicit return types on exported functions.

## File Organization

- **One component/module per file.** Max ~200 lines.
- **Named exports only.** No default exports.
- Filename matches the primary export: `UserCard.tsx` exports `UserCard`.
- Group by feature, not by type:
  ```
  features/
    auth/
      LoginForm.tsx
      LoginForm.test.tsx
      useAuth.ts
      auth.api.ts
  ```

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `UserCard` |
| Hooks | camelCase, `use` prefix | `useAuth` |
| Utilities | camelCase | `formatDate` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `UserProfile` |
| Files (components) | PascalCase | `UserCard.tsx` |
| Files (non-component) | camelCase | `formatDate.ts` |
| CSS classes | Tailwind utilities or SASS BEM | `.card__header` |

## React

- Functional components only.
- Colocate state as close to usage as possible.
- Extract hooks when logic is reused or complex.
- Props interface named `<ComponentName>Props`.
- Avoid prop drilling past 2 levels — use Zustand or context.

## Styling

- **TailwindCSS** for utility-first styling (primary).
- **SASS modules** (`*.module.scss`) for complex/reusable component styles.
- Never use inline `style` objects.
- Keep Tailwind class lists readable — extract to variables or use `clsx`/`cn` when >4 classes.

## Imports

Order (enforced by ESLint):

1. External packages (`react`, `express`, etc.)
2. Internal aliases (`@web/`, `@api/`, `@shared/`)
3. Relative imports (`./`, `../`)

Blank line between each group.

## Error Handling

- API layer: catch errors in middleware, return consistent error shapes.
- Frontend: use error boundaries for render errors, try/catch for async.
- Never silently swallow errors. Log or propagate.

## Comments

- Don't comment *what* the code does — make the code self-explanatory.
- Comment *why* when the reason isn't obvious.
- Use `// TODO:` for known follow-ups. Include context.
