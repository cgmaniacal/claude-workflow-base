export function getApiTemplates(projectName) {
  const dbName = projectName.replace(/-/g, '_') + '_dev';
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
            helmet: '^8',
            cors: '^2',
            'express-rate-limit': '^7',
            '@prisma/client': '^6',
            '@repo/shared': '*',
          },
          devDependencies: {
            '@types/express': '^4',
            '@types/cors': '^2',
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
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';

// Validate required env vars at startup
const required = ['DATABASE_URL', 'CORS_ORIGIN'] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(\`Missing required env var: \${key}\`);
}

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10kb' }));

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
    path: 'apps/api/src/lib/errors.ts',
    content: `export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
  }
}
`,
  });

  files.push({
    path: 'apps/api/src/middleware/errorHandler.ts',
    content: `import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
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
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`,
  });

  files.push({
    path: 'apps/api/.env.example',
    content: `DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/${dbName}"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
`,
  });

  files.push({
    path: 'apps/api/.env',
    content: `DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/${dbName}"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
`,
  });

  files.push({
    path: 'apps/api/vitest.config.ts',
    content: `import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@api': resolve(__dirname, 'src'),
    },
  },
});
`,
  });

  return files;
}
