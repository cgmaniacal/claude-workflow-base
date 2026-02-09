export function getApiTemplates() {
  const files = [];

  files.push({
    path: 'apps/api/package.json',
    content:
      JSON.stringify(
        {
          name: '@repo/api',
          private: true,
          type: 'module',
          scripts: {
            dev: 'tsx watch src/server.ts',
            build: 'tsc',
            lint: 'eslint .',
            test: 'vitest run',
            'test:watch': 'vitest',
          },
          dependencies: {
            express: '^4',
            '@prisma/client': '^6',
            '@repo/shared': '*',
          },
          devDependencies: {
            '@types/express': '^4',
            prisma: '^6',
            tsx: '^4',
            typescript: '^5',
            vitest: '^3',
            supertest: '^7',
            '@types/supertest': '^6',
          },
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'apps/api/tsconfig.json',
    content:
      JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            outDir: 'dist',
            rootDir: 'src',
            baseUrl: '.',
            paths: {
              '@api/*': ['src/*'],
              '@shared/*': ['../../packages/shared/src/*'],
            },
          },
          include: ['src'],
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'apps/api/src/app.ts',
    content: `import express from 'express';

import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use('/api/v1/health', healthRouter);
app.use(errorHandler);

export { app };
`,
  });

  files.push({
    path: 'apps/api/src/server.ts',
    content: `import { app } from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(\`API server running on http://localhost:\${PORT}\`);
});
`,
  });

  files.push({
    path: 'apps/api/src/routes/health.ts',
    content: `import { Router } from 'express';
import type { Request, Response } from 'express';

const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({ data: { status: 'ok' } });
});

export { healthRouter };
`,
  });

  files.push({
    path: 'apps/api/src/middleware/errorHandler.ts',
    content: `import type { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = err.message ?? 'An unexpected error occurred';

  console.error(\`[Error] \${code}: \${message}\`);

  res.status(statusCode).json({
    error: { code, message },
  });
}
`,
  });

  files.push({
    path: 'apps/api/src/prisma/schema.prisma',
    content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
`,
  });

  files.push({
    path: 'apps/api/.env.example',
    content: `DATABASE_URL="mysql://root:password@localhost:3306/myapp"
PORT=3001
`,
  });

  return files;
}
