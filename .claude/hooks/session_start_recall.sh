#!/bin/bash
# Auto-recall hook — runs on session start (startup/resume)
# Outputs context that Claude sees immediately (stdout → Claude context)
# Enhanced: skill awareness injection + memory commands

MEMORY_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/memory"

# Kick off file index update in background (non-blocking)
if [ -x "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/update_file_index.sh" ]; then
    bash "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/update_file_index.sh" &
fi

# If memory tree doesn't exist yet, just note that
if [ ! -d "$MEMORY_DIR" ]; then
    echo "Memory system: No memory tree found. Run /remember after your first session to initialize."
    exit 0
fi

# Count total memories (excluding _index.md and dotfiles)
TOTAL=$(find "$MEMORY_DIR" -name "*.md" ! -name "_index.md" ! -name ".*" 2>/dev/null | wc -l | tr -d ' ')
DOMAINS=$(find "$MEMORY_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')

echo "Memory system active — $TOTAL memories across $DOMAINS domains."

# === SKILL AWARENESS INJECTION ===
echo ""
echo "--- AVAILABLE COMMANDS ---"
echo "Memory: /remember (save context) | /recall [topic] (search memory) | /memory-status"
echo "--- END COMMANDS ---"

# === MEMORY CONTEXT INJECTION ===

# Inject last session summary
LATEST_SESSION=$(find "$MEMORY_DIR/sessions" -name "*.md" ! -name "_index.md" -type f 2>/dev/null | sort -r | head -1)
if [ -n "$LATEST_SESSION" ] && [ -f "$LATEST_SESSION" ]; then
    echo ""
    echo "--- LAST SESSION ---"
    head -30 "$LATEST_SESSION"
    echo "--- END LAST SESSION ---"
fi

# Inject preferences (always relevant)
if [ -d "$MEMORY_DIR/preferences" ]; then
    PREFS=$(find "$MEMORY_DIR/preferences" -name "*.md" ! -name "_index.md" -type f 2>/dev/null | head -5)
    if [ -n "$PREFS" ]; then
        echo ""
        echo "--- PREFERENCES ---"
        for pref in $PREFS; do
            head -20 "$pref"
            echo ""
        done
        echo "--- END PREFERENCES ---"
    fi
fi

# Inject recent decisions (last 3, title + summary only)
RECENT_DECISIONS=$(find "$MEMORY_DIR/decisions" -name "*.md" ! -name "_index.md" -type f 2>/dev/null | sort -r | head -3)
if [ -n "$RECENT_DECISIONS" ]; then
    echo ""
    echo "--- RECENT DECISIONS ---"
    for dec in $RECENT_DECISIONS; do
        head -15 "$dec"
        echo "..."
        echo ""
    done
    echo "--- END RECENT DECISIONS ---"
fi

# Check for in-progress plans
IN_PROGRESS=$(grep -rl "Status:.*in-progress" "$MEMORY_DIR/plans/" 2>/dev/null | head -1)
if [ -n "$IN_PROGRESS" ]; then
    PLAN_NAME=$(basename "$IN_PROGRESS")
    echo ""
    echo "--- ACTIVE PLAN ---"
    echo "In-progress plan: $PLAN_NAME"
    head -20 "$IN_PROGRESS"
    echo "Active plan found: review $PLAN_NAME and continue where you left off."
    echo "--- END ACTIVE PLAN ---"
fi

echo ""
echo "Use /recall [topic] for deeper memory search. Use /remember to save context."

exit 0
