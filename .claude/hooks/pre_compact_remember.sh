#!/bin/bash
# Pre-compaction hook — runs before context compaction
# Enhanced: writes structured compaction summary (not just timestamp)
# PreCompact stdout is NOT seen by Claude — we write to files instead
# Post-compaction context re-injection is handled by post_compact_recall.sh

MEMORY_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/memory"
SESSIONS_DIR="$MEMORY_DIR/sessions"
TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)
TODAY=$(date +%Y-%m-%d)

# Ensure directories exist
mkdir -p "$SESSIONS_DIR"

# Write compaction marker with timestamp
echo "$TIMESTAMP" > "$SESSIONS_DIR/.last-compaction"

# Write structured compaction summary
# This file is read by post_compact_recall.sh to re-inject context
SUMMARY="$SESSIONS_DIR/.compaction-summary.md"
{
    echo "# Compaction at $TIMESTAMP"
    echo ""
    echo "Context was compacted. Key state before compaction:"
    echo ""

    # Check for in-progress plans
    if [ -d "$MEMORY_DIR/plans" ]; then
        IN_PROGRESS=$(grep -rl "Status:.*in-progress" "$MEMORY_DIR/plans/" 2>/dev/null | head -1)
        if [ -n "$IN_PROGRESS" ]; then
            echo "## Active Plan"
            echo "File: $(basename "$IN_PROGRESS")"
            # Extract last completed task
            LAST_DONE=$(grep -n "\[x\]" "$IN_PROGRESS" 2>/dev/null | tail -1)
            if [ -n "$LAST_DONE" ]; then
                echo "Last completed: $LAST_DONE"
            fi
            # Extract next unchecked task
            NEXT_TODO=$(grep -n "\[ \]" "$IN_PROGRESS" 2>/dev/null | head -1)
            if [ -n "$NEXT_TODO" ]; then
                echo "Next task: $NEXT_TODO"
            fi
            echo ""
        fi
    fi

    # Recent session summary
    LATEST_SESSION=$(find "$SESSIONS_DIR" -name "*.md" ! -name "_index.md" ! -name ".*" -type f 2>/dev/null | sort -r | head -1)
    if [ -n "$LATEST_SESSION" ] && [ -f "$LATEST_SESSION" ]; then
        echo "## Last Session Notes"
        head -15 "$LATEST_SESSION"
        echo ""
    fi

    # Message count
    COUNTER_FILE="$MEMORY_DIR/.message-counter"
    if [ -f "$COUNTER_FILE" ]; then
        COUNT=$(cat "$COUNTER_FILE" 2>/dev/null)
        echo "Messages this session before compaction: $COUNT"
    fi
} > "$SUMMARY"

exit 0
