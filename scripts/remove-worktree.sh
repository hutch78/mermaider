#!/bin/bash

# Script to remove a worktree
# Usage: ./remove-worktree.sh <project-name>

set -e

PROJECT_NAME="$1"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT_DIR="$(dirname "$BASE_DIR")"
BASE_TEMPLATE="$PARENT_DIR/base-template"
PROJECT_PATH="$PARENT_DIR/$PROJECT_NAME"

if [ -z "$PROJECT_NAME" ]; then
    echo "Error: Project name is required"
    echo "Usage: $0 <project-name>"
    exit 1
fi

if [ ! -d "$BASE_TEMPLATE" ]; then
    echo "Base template not found at $BASE_TEMPLATE"
    exit 1
fi

if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project directory not found: $PROJECT_PATH"
    exit 1
fi

# Confirm deletion
read -p "Are you sure you want to remove worktree '$PROJECT_NAME'? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

# Remove worktree
cd "$BASE_TEMPLATE"
git worktree remove "$PROJECT_PATH" --force 2>/dev/null || {
    # Fallback: manual removal
    rm -rf "$PROJECT_PATH"
    git worktree prune
}

echo "✓ Worktree removed: $PROJECT_PATH"
