export function getRootTemplates(isFullStack, projectName) {
  const files = [];

  const workspaces = isFullStack ? ['apps/*', 'packages/*'] : ['apps/*'];

  files.push({
    path: 'package.json',
    content:
      JSON.stringify(
        {
          name: projectName,
          private: true,
          workspaces,
          scripts: {
            dev: 'turbo dev',
            build: 'turbo build',
            lint: 'turbo lint',
            test: 'turbo test',
            'test:watch': 'turbo test -- --watch',
          },
          devDependencies: {
            turbo: '^2',
            typescript: '^5',
            eslint: '^9',
            prettier: '^3',
            'eslint-config-prettier': '^10',
            '@typescript-eslint/parser': '^8',
            '@typescript-eslint/eslint-plugin': '^8',
          },
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'turbo.json',
    content:
      JSON.stringify(
        {
          $schema: 'https://turbo.build/schema.json',
          tasks: {
            build: { dependsOn: ['^build'], outputs: ['dist/**'] },
            lint: { dependsOn: ['^build'] },
            dev: { cache: false, persistent: true },
            test: { cache: false },
          },
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'tsconfig.base.json',
    content:
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noUncheckedIndexedAccess: true,
            declaration: true,
            declarationMap: true,
            sourceMap: true,
          },
          exclude: ['node_modules', 'dist'],
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: '.gitignore',
    content: `node_modules/
dist/
.turbo/
.env
.env.*
!.env.example
*.log
.DS_Store
coverage/
.claude/memory/
`,
  });

  files.push({
    path: '.prettierrc',
    content:
      JSON.stringify(
        {
          semi: true,
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 100,
          tabWidth: 2,
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'eslint.config.mjs',
    content: `import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
    },
  },
  prettierConfig,
];
`,
  });

  files.push({
    path: '.nvmrc',
    content: '22\n',
  });

  if (isFullStack) {
    const dbName = projectName.replace(/-/g, '_') + '_dev';
    files.push({
      path: 'docker-compose.yml',
      content: `services:
  db:
    image: mysql:8
    ports:
      - '3306:3306'
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: ${dbName}
      MYSQL_USER: devuser
      MYSQL_PASSWORD: devpassword
    volumes:
      - dbdata:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  dbdata:
`,
    });
  }

  files.push({
    path: '.github/workflows/ci.yml',
    content: `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run test

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
`,
  });

  return files;
}
