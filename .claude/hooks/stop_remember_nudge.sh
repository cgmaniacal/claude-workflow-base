#!/bin/bash
# Stop hook — fires when Claude finishes responding
# Enhanced: tracks message count, nudges /remember, checks for mid-plan state
# Reads JSON from stdin with stop_hook_active field

MEMORY_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/memory"
COUNTER_FILE="$MEMORY_DIR/.message-counter"

# Read stdin (required for Stop hooks — JSON with stop_hook_active, etc.)
INPUT=$(cat)

# Check if a stop hook already triggered continuation (prevent infinite loop)
STOP_ACTIVE=$(echo "$INPUT" | grep -o '"stop_hook_active"[[:space:]]*:[[:space:]]*true' 2>/dev/null)
if [ -n "$STOP_ACTIVE" ]; then
    echo '{}'
    exit 0
fi

# Ensure memory dir exists
mkdir -p "$MEMORY_DIR"

# Increment counter
if [ -f "$COUNTER_FILE" ]; then
    COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
    if ! [[ "$COUNT" =~ ^[0-9]+$ ]]; then
        COUNT=0
    fi
    COUNT=$((COUNT + 1))
else
    COUNT=1
fi
echo "$COUNT" > "$COUNTER_FILE"

# Every 15 messages, block and nudge Claude to /remember
if [ $((COUNT % 15)) -eq 0 ] && [ "$COUNT" -gt 0 ]; then
    # Check for in-progress plans to add context to the nudge
    PLAN_NOTE=""
    if [ -d "$MEMORY_DIR/plans" ]; then
        IN_PROGRESS=$(grep -rl "Status:.*in-progress" "$MEMORY_DIR/plans/" 2>/dev/null | head -1)
        if [ -n "$IN_PROGRESS" ]; then
            PLAN_NAME=$(basename "$IN_PROGRESS")
            PLAN_NOTE=" You also have an active plan ($PLAN_NAME) — update its checkboxes before saving."
        fi
    fi

    echo '{"decision":"block","reason":"You have exchanged ~'"$COUNT"' messages this session. Run /remember to capture key context before it scrolls out of the active window.'"$PLAN_NOTE"' Then continue with the task."}'
else
    echo '{}'
fi

exit 0
