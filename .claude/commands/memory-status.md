---
description: Show a summary of what's stored in the memory tree
---

Walk the memory tree at `.claude/memory/` and report:

1. Total number of memory files (excluding `_index.md` files)
2. Count per domain (decisions, patterns, bugs, preferences, context, sessions, files, and any custom domains)
3. Most recently updated entries (top 5)
4. Total approximate size of the memory tree

If the memory tree doesn't exist, report that and offer to initialize it.

Format the output as a clean, concise status report.
