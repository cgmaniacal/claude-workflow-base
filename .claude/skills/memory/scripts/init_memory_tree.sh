#!/bin/bash
# Initialize the memory tree structure
# Usage: bash .claude/skills/memory/scripts/init_memory_tree.sh [project_root]

PROJECT_ROOT="${1:-${CLAUDE_PROJECT_DIR:-.}}"
MEMORY_DIR="$PROJECT_ROOT/.claude/memory"

if [ -d "$MEMORY_DIR" ] && [ -f "$MEMORY_DIR/_index.md" ]; then
    echo "Memory tree already exists at $MEMORY_DIR"
    # Ensure all domains exist (idempotent — adds new domains to existing trees)
    DOMAINS=("decisions" "patterns" "bugs" "preferences" "context" "sessions" "research" "plans" "files")
    for domain in "${DOMAINS[@]}"; do
        mkdir -p "$MEMORY_DIR/$domain"
        # Create _index.md if missing
        if [ ! -f "$MEMORY_DIR/$domain/_index.md" ]; then
            DOMAIN_UPPER=$(echo "$domain" | sed 's/.*/\u&/')
            cat > "$MEMORY_DIR/$domain/_index.md" << EOF
# $DOMAIN_UPPER

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF
            echo "  Created missing index for $domain/"
        fi
    done
    # Update root index if research/ or plans/ missing from it
    if ! grep -q "research/" "$MEMORY_DIR/_index.md" 2>/dev/null; then
        echo "| research/ | Codebase research documents | — |" >> "$MEMORY_DIR/_index.md"
        echo "  Added research/ to root index"
    fi
    if ! grep -q "plans/" "$MEMORY_DIR/_index.md" 2>/dev/null; then
        echo "| plans/ | Implementation plans and design docs | — |" >> "$MEMORY_DIR/_index.md"
        echo "  Added plans/ to root index"
    fi
    echo "Verified all domain directories exist."
    exit 0
fi

echo "Initializing memory tree at $MEMORY_DIR..."

DOMAINS=("decisions" "patterns" "bugs" "preferences" "context" "sessions" "research" "plans" "files")

mkdir -p "$MEMORY_DIR"
for domain in "${DOMAINS[@]}"; do
    mkdir -p "$MEMORY_DIR/$domain"
done

# Create root index
cat > "$MEMORY_DIR/_index.md" << 'EOF'
# Memory Tree

Root index for the project memory system.

## Domains

| Domain | Description | Updated |
|---|---|---|
| decisions/ | Architecture, tech choices, strategic decisions | — |
| patterns/ | Reusable solutions, code patterns, techniques | — |
| bugs/ | Bugs encountered, root causes, fixes | — |
| preferences/ | User style, conventions, tool preferences | — |
| context/ | Project architecture, domain knowledge, business logic | — |
| sessions/ | Auto-generated session summaries | — |
| research/ | Codebase research documents | — |
| plans/ | Implementation plans and design docs | — |
| files/ | Project file directory index (auto-updated each session) | — |
EOF

cat > "$MEMORY_DIR/decisions/_index.md" << 'EOF'
# Decisions

Architectural, technical, and strategic decisions made during the project.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF

cat > "$MEMORY_DIR/patterns/_index.md" << 'EOF'
# Patterns

Reusable solutions, code patterns, and techniques discovered during development.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF

cat > "$MEMORY_DIR/bugs/_index.md" << 'EOF'
# Bugs

Bugs encountered, their root causes, and how they were resolved.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF

cat > "$MEMORY_DIR/preferences/_index.md" << 'EOF'
# Preferences

User preferences for coding style, tools, conventions, and workflows.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF

cat > "$MEMORY_DIR/context/_index.md" << 'EOF'
# Context

Project architecture, domain knowledge, business logic, and background information.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF

cat > "$MEMORY_DIR/sessions/_index.md" << 'EOF'
# Sessions

Auto-generated summaries of past working sessions.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF

cat > "$MEMORY_DIR/research/_index.md" << 'EOF'
# Research

Codebase research documents. Each document is self-contained with findings, code references, and open questions.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF

cat > "$MEMORY_DIR/plans/_index.md" << 'EOF'
# Plans

Implementation plans and design docs. Plans are living documents with progress checkboxes. Status: draft → approved → in-progress → completed.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
EOF

cat > "$MEMORY_DIR/files/_index.md" << 'EOF'
# Files

Project file directory index, auto-updated at each session start.

## Contents

| File/Folder | Summary | Updated |
|---|---|---|
| project_files.md | Complete index of all project files with descriptions | — |
EOF

echo "Memory tree initialized with ${#DOMAINS[@]} domains."
echo "Use /remember to capture context, /recall to search, /memory-status to browse."
