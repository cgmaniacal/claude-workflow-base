---
name: memory
description: "Persistent hierarchical memory storage for cross-session knowledge. This skill defines the memory tree structure under .claude/memory/ — a branching folder hierarchy organized by domain > topic > subtopic. Use this skill whenever reading, writing, browsing, or organizing the memory tree. Triggers on: /memory, /memory-status, any direct reference to 'the memory tree', or when other skills (remember/recall) need to interact with storage."
---

# Memory Skill

## Tree Structure

The memory tree lives at `.claude/memory/` relative to project root. It uses a hierarchical folder structure with `_index.md` files at every level for fast navigation.

### Default Top-Level Domains

```
.claude/memory/
├── _index.md          # Root index
├── decisions/         # Architecture, tech choices, strategic decisions
├── patterns/          # Reusable solutions, code patterns, techniques
├── bugs/              # Bugs encountered, root causes, fixes
├── preferences/       # User style, conventions, tool preferences
├── context/           # Project architecture, domain knowledge, business logic
├── sessions/          # Auto-generated session summaries
├── research/          # Codebase research documents
├── plans/             # Implementation plans and design docs
└── files/             # Project file directory index (auto-updated each session)
```

New domains can be created as needed. Common additions: `people/`, `apis/`, `infrastructure/`.

### _index.md Format

Every directory must have an `_index.md`:

```markdown
# [Domain Name]

[One sentence describing what this domain contains.]

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
| auth-flow.md | JWT auth architecture decision | 2025-02-06 |
| database/ | All database-related memories | 2025-02-05 |
```

### Branching Rules

- A directory with **>8 files** should be subdivided into topic folders.
- Maximum tree depth: **5 levels** (to stay navigable).
- Leaf nodes are always `.md` files.
- When creating a new subdirectory, move relevant existing files into it and update the parent `_index.md`.

## Operations

### Browse (`/memory`)
1. Read `.claude/memory/_index.md` to show the top-level overview.
2. Offer to drill into any domain.

### Status (`/memory-status`)
1. Walk the tree and count files per domain.
2. Report: total memories, memories by domain, last updated dates.

### Write (called by Remember skill or agents)
1. Determine the correct domain and topic path.
2. Check if a related memory already exists (search `_index.md` files and filenames).
3. If exists: update the existing file, bump `Last Updated`.
4. If new: create the file using the standard entry format, update all `_index.md` files in the path.

### Read (called by Recall skill or agents)
1. Start at `_index.md`, scan for relevant domains.
2. Drill into matching domains, read their `_index.md` files.
3. Return summaries of matching entries. Only read full files when high relevance is confirmed.

## Special Domains

### files/
Auto-maintained directory index of all project files. Regenerated at each session start by `update_file_index.sh`. Preserves hand-written descriptions.

### research/
Structured research documents. Each document is self-contained with findings, code references, and open questions.

### plans/
Implementation plans and design docs. Plans are living documents with progress checkboxes. Status field tracks: draft → approved → in-progress → completed.

## Initialization

On first use, run `bash .claude/skills/memory/scripts/init_memory_tree.sh` to create the directory tree.
