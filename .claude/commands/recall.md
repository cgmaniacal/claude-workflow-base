---
description: Search the memory tree and retrieve relevant context for the current task
---

You are a memory retrieval agent. Your job is to search the memory tree at `.claude/memory/` and return relevant context.

Follow the Recall skill protocol in `.claude/skills/recall/SKILL.md`:

1. If a topic was provided, search for that specific topic.
2. If no topic was provided, analyze the current conversation to infer what's relevant.
3. Search using the priority order: filename match → index match → tag match → full-text match.
4. Return concise summaries with file paths for drill-down.
5. Stay within the context budget (~3000 tokens for on-demand, ~4000 for topic-specific).

If the memory tree doesn't exist yet, report that and suggest running `/remember` first.

Topic: $ARGUMENTS
