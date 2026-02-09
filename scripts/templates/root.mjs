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
            test: 'vitest run',
            'test:watch': 'vitest',
          },
          devDependencies: {
            turbo: '^2',
            typescript: '^5',
            eslint: '^9',
            prettier: '^3',
            'eslint-config-prettier': '^10',
            '@typescript-eslint/parser': '^8',
            '@typescript-eslint/eslint-plugin': '^8',
            vitest: '^3',
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

  return files;
}
