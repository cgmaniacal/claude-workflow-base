export function getSharedTemplates() {
  const files = [];

  files.push({
    path: 'packages/shared/package.json',
    content:
      JSON.stringify(
        {
          name: '@repo/shared',
          private: true,
          type: 'module',
          main: 'src/index.ts',
          types: 'src/index.ts',
          scripts: {
            build: 'tsc',
            lint: 'eslint .',
          },
          devDependencies: {
            typescript: '^5',
          },
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'packages/shared/tsconfig.json',
    content:
      JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            outDir: 'dist',
            rootDir: 'src',
            composite: true,
            baseUrl: '.',
            paths: { '@shared/*': ['src/*'] },
          },
          include: ['src'],
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'packages/shared/src/index.ts',
    content: `export * from './types/index';
`,
  });

  files.push({
    path: 'packages/shared/src/types/index.ts',
    content: `export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
`,
  });

  return files;
}
