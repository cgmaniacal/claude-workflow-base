---
name: recall
description: "Search the memory tree and retrieve relevant context. Uses a memory-locator sub-agent to search without polluting the parent context. Triggers on: /recall, /recall [topic], or when Claude needs context it might have stored."
---

# Recall Skill

## Purpose

Search the memory tree (`.claude/memory/`) and retrieve relevant context. Uses sub-agent dispatch to preserve the parent's context window.

## Execution Protocol

### Automatic Recall (Session Start)

Performed by the session-start hook (not this skill). Lightweight, ~1500 tokens max.

### On-Demand Recall (`/recall` or `/recall [topic]`)

#### Step 1: Dispatch memory-locator agent
Send the query to a **memory-locator** sub-agent (`.claude/agents/memory-locator.md`). This keeps the search cost (file reads, grep scans) out of the parent context.

The agent returns a list of matching file paths with one-line summaries.

#### Step 2: Read high-relevance entries
For the top 3-5 matches returned by the locator, read the full files in the parent context. Only pull in what's truly relevant.

#### Step 3: Synthesize and present

**Without topic (`/recall`):**
1. Analyze the current conversation to infer relevant topics.
2. Dispatch memory-locator with inferred keywords.
3. Return summaries of the top 5-10 most relevant memories.

**With topic (`/recall [topic]`):**
1. Dispatch memory-locator with the topic.
2. Read full content of highly relevant entries.
3. Return full entries for direct matches, summaries for tangential ones.

### Output Format

```
## Recalled Memories

### [Domain] -- [Title] (Updated: YYYY-MM-DD)
[1-3 sentence summary from the memory entry]
-> Full entry: .claude/memory/[path]

### [Domain] -- [Title] (Updated: YYYY-MM-DD)
[1-3 sentence summary]
-> Full entry: .claude/memory/[path]

---
{X} total memories found across {Y} domains
```

### Context Budget

| Mode | Budget | Strategy |
|------|--------|----------|
| Auto-recall (session start) | ~1500 tokens | One-liners from indexes only |
| On-demand `/recall` | ~3000 tokens | Summaries from entries |
| Topic-specific `/recall X` | ~4000 tokens | Full entries for direct matches |

Prioritize by: most recently updated → highest confidence → most relevant domain.

## Why Sub-Agent Dispatch?

Searching the memory tree involves reading multiple `_index.md` files, running grep across directories, and scanning file contents. If done in the parent context, this consumes significant tokens on search operations before any actual work begins.

By dispatching a memory-locator agent:
- The parent context stays clean for the actual task.
- The agent's search reads are isolated in its own context window.
- Only the final results (paths + summaries) enter the parent context.

This is the core ACE principle: **subagents are about context control, not role-playing.**
