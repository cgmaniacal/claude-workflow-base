#!/bin/bash
# Regenerate the project file directory index
# Called by session_start_recall.sh in background
# Smart merge: preserves existing descriptions, detects new/deleted files
# Compatible with macOS bash 3.2 (no associative arrays)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
PROJECT_NAME=$(basename "$PROJECT_DIR")
INDEX_FILE="$PROJECT_DIR/.claude/memory/files/project_files.md"
TEMP_FILE="$PROJECT_DIR/.claude/memory/files/.project_files_new.md"
DESC_FILE="$PROJECT_DIR/.claude/memory/files/.descriptions_cache"

mkdir -p "$PROJECT_DIR/.claude/memory/files"

# Migrate from old project-specific naming if needed
OLD_INDEX="$PROJECT_DIR/.claude/memory/files/coherany_files.md"
if [ -f "$OLD_INDEX" ] && [ ! -f "$INDEX_FILE" ]; then
    mv "$OLD_INDEX" "$INDEX_FILE"
fi

# Build current file list (excluding noise directories)
CURRENT_FILES=$(find "$PROJECT_DIR" \
    -not -path "*/.git/*" \
    -not -path "*/node_modules/*" \
    -not -path "*/__pycache__/*" \
    -not -path "*/.venv/*" \
    -not -path "*/venv/*" \
    -not -path "*/.pytest_cache/*" \
    -not -path "*/.mypy_cache/*" \
    -not -path "*/.ruff_cache/*" \
    -not -path "*/data_exports/prototypes/*.sql" \
    -not -path "*/dist/*" \
    -not -path "*/build/*" \
    -not -path "*/.next/*" \
    -not -path "*/.claude/memory/*" \
    -not -path "*/htmlcov/*" \
    -not -path "*/.hypothesis/*" \
    -not -name ".DS_Store" \
    -not -name "*.pyc" \
    -not -name "*.pyo" \
    -type f 2>/dev/null | \
    sed "s|^$PROJECT_DIR/||" | \
    sort)

# If no existing index, create a fresh one
if [ ! -f "$INDEX_FILE" ]; then
    {
        echo "# $PROJECT_NAME File Index"
        echo ""
        echo "> Use this to find ANY file. Paths relative to \`$PROJECT_DIR/\`"
        echo "> Auto-updated each session by update_file_index.sh"
        echo "> Last updated: $(date +%Y-%m-%d)"
        echo ""

        CURRENT_DIR=""
        while IFS= read -r filepath; do
            DIR=$(dirname "$filepath")
            if [ "$DIR" != "$CURRENT_DIR" ]; then
                CURRENT_DIR="$DIR"
                echo "## $DIR/"
            fi
            BASENAME=$(basename "$filepath")
            echo "- \`$BASENAME\`"
        done <<< "$CURRENT_FILES"
    } > "$INDEX_FILE"
    rm -f "$DESC_FILE"
    exit 0
fi

# Extract existing descriptions into a flat file for lookup
# Format: FILENAME<TAB>DESCRIPTION
> "$DESC_FILE"
while IFS= read -r line; do
    # Match: - `filename` - Description here
    case "$line" in
        "- \`"*)
            # Extract filename and description using sed
            FNAME=$(echo "$line" | sed -n 's/^- `\([^`]*\)`.*/\1/p')
            DESC=$(echo "$line" | sed -n 's/^- `[^`]*` - \(.*\)$/\1/p')
            if [ -n "$FNAME" ] && [ -n "$DESC" ]; then
                printf '%s\t%s\n' "$FNAME" "$DESC" >> "$DESC_FILE"
            fi
            ;;
    esac
done < "$INDEX_FILE"

# Generate new index preserving descriptions
{
    echo "# $PROJECT_NAME File Index"
    echo ""
    echo "> Use this to find ANY file. Paths relative to \`$PROJECT_DIR/\`"
    echo "> Auto-updated each session by update_file_index.sh"
    echo "> Last updated: $(date +%Y-%m-%d)"
    echo ""

    CURRENT_DIR=""
    while IFS= read -r filepath; do
        DIR=$(dirname "$filepath")
        if [ "$DIR" != "$CURRENT_DIR" ]; then
            CURRENT_DIR="$DIR"
            echo ""
            echo "## $DIR/"
        fi
        BASENAME=$(basename "$filepath")
        # Look up description from cache file
        DESC=""
        if [ -f "$DESC_FILE" ]; then
            # Try exact basename match first
            DESC=$(grep "^${BASENAME}	" "$DESC_FILE" 2>/dev/null | head -1 | cut -f2-)
        fi
        if [ -n "$DESC" ]; then
            echo "- \`$BASENAME\` - $DESC"
        else
            echo "- \`$BASENAME\`"
        fi
    done <<< "$CURRENT_FILES"
} > "$TEMP_FILE"

# Clean up cache
rm -f "$DESC_FILE"

# Only update if content changed (ignore the date line)
OLD_HASH=$(grep -v "Last updated:" "$INDEX_FILE" 2>/dev/null | shasum | cut -d' ' -f1)
NEW_HASH=$(grep -v "Last updated:" "$TEMP_FILE" 2>/dev/null | shasum | cut -d' ' -f1)

if [ "$OLD_HASH" != "$NEW_HASH" ]; then
    mv "$TEMP_FILE" "$INDEX_FILE"
else
    rm -f "$TEMP_FILE"
fi

exit 0
