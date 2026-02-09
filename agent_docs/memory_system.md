# Memory System

Detailed documentation for the persistent memory system. Read this when working with memory commands, debugging hook behavior, or understanding the memory tree structure.

## How It Works (Automatic)

| Event | What Happens |
|-------|-------------|
| **Session starts** | Hook auto-loads last session summary, preferences, decisions, and active plans |
| **Every ~15 messages** | Hook nudges Claude to run `/remember` and save key context |
| **Before compaction** | Hook saves structured summary (active plan state, session notes) |
| **After compaction** | Hook re-injects key context including active plan progress |
| **File index** | Auto-updates `.claude/memory/files/` project file index each session |

## Memory Commands

| Command | Description |
|---------|-------------|
| `/remember` | Two-pass extraction: identify items, quality-check (dedup, format), write with verification |
| `/recall [topic]` | Sub-agent dispatched search (preserves parent context) |
| `/memory-status` | Show stored memory count by domain |

## Architecture

### Three Skills

1. **Memory Skill** (`.claude/skills/memory/`) — The storage layer. A hierarchical tree of markdown files at `.claude/memory/`.
2. **Remember Skill** (`.claude/skills/remember/`) — The write layer. Extracts insights from conversation and writes them into the memory tree.
3. **Recall Skill** (`.claude/skills/recall/`) — The read layer. Searches the memory tree for relevant context.

### Hooks (Fully Automatic)

Configured in `.claude/settings.json`:

- **SessionStart (startup/resume)** — `hooks/session_start_recall.sh` — loads last session, preferences, decisions, active plans
- **SessionStart (compact)** — `hooks/post_compact_recall.sh` — re-injects key context after compaction
- **PreCompact** — `hooks/pre_compact_remember.sh` — saves structured compaction summary
- **Stop** — `hooks/stop_remember_nudge.sh` — counts messages, nudges `/remember` every ~15 exchanges
- **Background** — `hooks/update_file_index.sh` — auto-maintains project file index

### Sub-Agents

| Agent | Role |
|-------|------|
| `memory-locator` | Find relevant memories (read-only, fast model) |
| `memory-writer` | Write entries with dedup and index updates |

## Memory Tree Structure

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

## Memory Entry Format

```markdown
# [Title]

**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
**Confidence:** high | medium | low
**Tags:** comma-separated-tags

## Summary
[1-3 sentence overview]

## Details
[Full content — decisions, code snippets, rationale]

## Related
[Links to related files or memory entries]
```

## Rules

- **Deduplicate** before writing; update existing entries rather than creating duplicates
- **Never delete** memories; mark as `**Status:** archived` instead
- **Keep indexes current**; every write updates relevant `_index.md` files
- **Verify writes**; confirm files and indexes were actually updated after `/remember`
- **No secrets**; never store credentials or API keys in memory
- **Reference, don't copy**; point to file paths instead of duplicating code
- **Subagents for context control**; dispatch search to sub-agents to keep parent context clean

## Initialization

The memory tree is created automatically during project setup via `init_memory_tree.sh`. To manually initialize or repair, run:

```bash
bash .claude/skills/memory/scripts/init_memory_tree.sh
```
