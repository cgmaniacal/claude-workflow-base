---
name: remember
description: "Extract and persist knowledge from the current conversation into the memory tree. Two-pass process: first extract what to remember, then quality-check for dedup and format. Triggers on: /remember, 'save this to memory', or when the stop hook nudges."
---

# Remember Skill

## Purpose

Extract valuable information from the current conversation and persist it into the memory tree (`.claude/memory/`). Uses a two-pass process for quality.

## What To Remember

1. **Decisions** -- Explicit choices made ("use PostgreSQL", "JWT not sessions")
2. **Patterns** -- Code solutions, techniques that worked
3. **Bugs** -- Errors encountered, root causes, fixes
4. **Preferences** -- User's stated preferences for style, tools, workflow
5. **Context** -- Project architecture, business logic, domain knowledge
6. **Session summary** -- What was accomplished this session

## What NOT To Remember

- Transient debugging steps that didn't lead anywhere
- Generic knowledge Claude already has
- Exact code already in the codebase (reference file paths instead)
- Sensitive credentials, API keys, passwords

## Two-Pass Execution Protocol

### Pass 1: Extract (what to remember)

Scan the conversation and identify all memorable items. For each, note:
- Category (decisions / patterns / bugs / preferences / context)
- A concise title
- The key information
- Related files or code references
- Confidence level (high / medium / low)
- Tags (lowercase, hyphenated)

### Pass 2: Quality check (dedup, format, placement)

For each extracted item:
1. **Dedup check:** Read the target domain's `_index.md`. Search for existing entries covering the same topic.
   - Match found → prepare UPDATE (append new info, bump date, merge tags)
   - No match → prepare CREATE
2. **Format check:** Ensure the entry follows the standard format (title, dates, tags, summary, details, related).
3. **Placement check:** Is this the right domain? Would it fit better in a subdomain?

### Write Phase

For each verified item:
1. Write/update the `.md` file using the standard memory entry format.
2. Update the domain's `_index.md` table.
3. Update the root `_index.md` date for that domain.
4. If a domain has >8 files, reorganize into subdirectories.

### Session Summary

Create or update `.claude/memory/sessions/{YYYY-MM-DD}-{brief-slug}.md` with:
- What was worked on
- Key outcomes
- Decisions made
- Open questions or next steps
- If mid-plan: which plan, which phase, current progress

### Verification Step

After all writes, verify:
1. Read each `_index.md` that was supposed to be updated — confirm the new entry appears.
2. Read one of the newly written files — confirm it has the correct format.
3. If any verification fails, fix it immediately.

### Report

```
Remembered {N} items:
- [category] Title (new/updated)
- [category] Title (new/updated)
Session summary saved to sessions/{filename}
Indexes verified: {count} updated
```

## Memory Entry Format

```markdown
# [Title]

**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
**Source:** session
**Confidence:** high | medium | low
**Tags:** comma-separated-tags

## Summary
[1-3 sentence summary]

## Details
[Full content -- decisions, code snippets, rationale]

## Related
- [Links to related memory files or codebase paths]
```

## Rules

- **Deduplicate** -- search before writing. Update rather than duplicate.
- **Never delete** -- mark as `**Status:** archived` instead.
- **Keep indexes current** -- every write updates relevant `_index.md` files.
- **Verify writes** -- check that files and indexes were actually updated.
- **Tag consistently** -- reuse existing tags from the tree.
- **No secrets** -- never store credentials or API keys.
- **Reference, don't copy** -- point to file paths instead of duplicating code.
