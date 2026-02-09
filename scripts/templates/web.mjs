export function getWebTemplates() {
  const files = [];

  files.push({
    path: 'apps/web/package.json',
    content:
      JSON.stringify(
        {
          name: '@repo/web',
          private: true,
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc -b && vite build',
            preview: 'vite preview',
            lint: 'eslint .',
            test: 'vitest run',
            'test:watch': 'vitest',
          },
          dependencies: {
            react: '^19',
            'react-dom': '^19',
            zustand: '^5',
          },
          devDependencies: {
            '@types/react': '^19',
            '@types/react-dom': '^19',
            '@vitejs/plugin-react': '^4',
            vite: '^6',
            typescript: '^5',
            tailwindcss: '^4',
            '@tailwindcss/vite': '^4',
            sass: '^1',
            vitest: '^3',
            jsdom: '^26',
            '@testing-library/react': '^16',
            '@testing-library/jest-dom': '^6',
            '@testing-library/user-event': '^14',
          },
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'apps/web/tsconfig.json',
    content:
      JSON.stringify(
        {
          files: [],
          references: [
            { path: './tsconfig.app.json' },
            { path: './tsconfig.node.json' },
          ],
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'apps/web/tsconfig.app.json',
    content:
      JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            composite: true,
            jsx: 'react-jsx',
            baseUrl: '.',
            paths: { '@web/*': ['src/*'] },
            tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
          },
          include: ['src'],
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'apps/web/tsconfig.node.json',
    content:
      JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            composite: true,
            tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
          },
          include: ['vite.config.ts'],
        },
        null,
        2,
      ) + '\n',
  });

  files.push({
    path: 'apps/web/vite.config.ts',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@web': resolve(__dirname, 'src'),
    },
  },
});
`,
  });

  files.push({
    path: 'apps/web/index.html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  });

  files.push({
    path: 'apps/web/src/main.tsx',
    content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
  });

  files.push({
    path: 'apps/web/src/App.tsx',
    content: `import styles from './App.module.scss';

export function App(): React.ReactElement {
  return (
    <div className={styles.app}>
      <h1 className="text-3xl font-bold text-center mt-20">
        Hello, World
      </h1>
    </div>
  );
}
`,
  });

  files.push({
    path: 'apps/web/src/App.module.scss',
    content: `.app {
  min-height: 100vh;
}
`,
  });

  files.push({
    path: 'apps/web/src/index.css',
    content: `@import 'tailwindcss';
`,
  });

  files.push({
    path: 'apps/web/src/vite-env.d.ts',
    content: `/// <reference types="vite/client" />
`,
  });

  return files;
}
