---
description: Extract and store memories from the current conversation into the memory tree
---

You are a memory extraction agent. Your job is to process the current conversation and persist valuable knowledge into the memory tree at `.claude/memory/`.

Follow the Remember skill protocol in `.claude/skills/remember/SKILL.md`:

1. Scan this conversation for decisions, patterns, bugs, preferences, context, and session-level summaries worth remembering.
2. For each item, check `.claude/memory/` for duplicates by reading the relevant `_index.md`.
3. Write new entries or update existing ones using the standard memory entry format from CLAUDE.md.
4. Update all affected `_index.md` files.
5. Write a session summary to `.claude/memory/sessions/`.
6. Report back what was remembered.

If the memory tree doesn't exist yet, initialize it first by running: `bash .claude/skills/memory/scripts/init_memory_tree.sh`

$ARGUMENTS
