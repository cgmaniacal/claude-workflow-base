#!/usr/bin/env node

import { createInterface } from 'node:readline';
import { writeFileSync, readFileSync, mkdirSync, unlinkSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { getRootTemplates } from './templates/root.mjs';
import { getWebTemplates } from './templates/web.mjs';
import { getApiTemplates } from './templates/api.mjs';
import { getSharedTemplates } from './templates/shared.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ── Utilities ────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function writeFile(relativePath, content) {
  const fullPath = join(ROOT, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  console.log(`  created ${relativePath}`);
}

function removeFile(relativePath) {
  const fullPath = join(ROOT, relativePath);
  if (existsSync(fullPath)) {
    unlinkSync(fullPath);
    console.log(`  removed ${relativePath}`);
  }
}

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function toTitleCase(kebab) {
  return kebab
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function updateReadme(projectName) {
  const readmePath = join(ROOT, 'README.md');
  if (!existsSync(readmePath)) return;

  const titleCase = toTitleCase(projectName);
  let content = readFileSync(readmePath, 'utf-8');
  content = content.replace(/^# claude-workflow-base/m, `# ${titleCase}`);
  content = content.replaceAll('claude-workflow-base', projectName);
  writeFileSync(readmePath, content, 'utf-8');
  console.log(`  updated README.md with project name: ${titleCase}`);
}

function getFrontendOnlyArchDoc() {
  return `# Service Architecture

## Project Scale

This is a **frontend-only** project. There is no backend API or database.

## apps/web (Frontend)

- **Framework:** React + TypeScript
- **Bundler:** Vite (dev server + build)
- **Styling:** TailwindCSS + SASS modules
- **State:** Zustand for global state, React state for local
- **Routing:** TBD (React Router or TanStack Router)

### Source Structure

\`\`\`
apps/web/src/
  components/       # Shared UI components
  features/         # Feature-grouped modules (components, hooks, api calls)
  hooks/            # Shared custom hooks
  stores/           # Zustand stores
  styles/           # Global SASS, Tailwind config
  lib/              # Utility functions, API client setup
  App.tsx
  main.tsx
\`\`\`

## Adding a New Feature

1. Create a feature directory under \`apps/web/src/features/\`
2. Add components, hooks, and tests within the feature directory
3. Export from a feature index if shared across features
4. Write tests for all business logic and user interactions
`;
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  if (existsSync(join(ROOT, 'apps'))) {
    console.error('Error: Project already scaffolded. The apps/ directory exists.');
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n  Project Setup\n');
  console.log('  1) Frontend only  (React + Vite + Tailwind)');
  console.log('  2) Full stack     (React + Express + Prisma + MySQL)\n');

  let choice = '';
  while (choice !== '1' && choice !== '2') {
    choice = (await ask(rl, '  Choose a configuration [1/2]: ')).trim();
  }
  rl.close();

  const isFullStack = choice === '2';
  const mode = isFullStack ? 'full-stack' : 'frontend-only';
  const projectName = basename(ROOT);
  console.log(`\n  Scaffolding ${mode} project: ${projectName}\n`);

  // Collect templates
  const files = [
    ...getRootTemplates(isFullStack, projectName),
    ...getWebTemplates(),
    ...(isFullStack ? getApiTemplates() : []),
    ...(isFullStack ? getSharedTemplates() : []),
  ];

  // Write all files
  for (const file of files) {
    writeFile(file.path, file.content);
  }

  // Update project name in README.md
  updateReadme(projectName);

  // Frontend-only: clean up backend agent_docs
  if (!isFullStack) {
    console.log('\n  Cleaning up backend docs...\n');
    removeFile('agent_docs/database_schema.md');
    removeFile('agent_docs/service_communication_patterns.md');
    writeFile('agent_docs/service_architecture.md', getFrontendOnlyArchDoc());
  }

  // Install dependencies
  run('npm install');

  // Initialize memory tree
  console.log('\n  Initializing memory tree...\n');
  run('bash .claude/skills/memory/scripts/init_memory_tree.sh');

  // Self-cleanup: remove setup scripts
  console.log('\n  Cleaning up setup scripts...\n');
  rmSync(join(ROOT, 'scripts'), { recursive: true, force: true });

  // Git commit
  run('git add -A');
  run(`git commit -m "chore: scaffold project (${mode})"`);

  console.log(`\n  Setup complete! Run \`npm run dev\` to start.\n`);
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
