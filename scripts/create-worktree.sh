#!/bin/bash

# Script to create a new Nuxt/TypeScript/Node 24 project worktree
# Usage: ./create-worktree.sh <project-name>

set -e

PROJECT_NAME="$1"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT_DIR="$(dirname "$BASE_DIR")"
BASE_TEMPLATE="$PARENT_DIR/base-template"

if [ -z "$PROJECT_NAME" ]; then
    echo "Error: Project name is required"
    echo "Usage: $0 <project-name>"
    exit 1
fi

NEW_PROJECT_PATH="$PARENT_DIR/$PROJECT_NAME"

# Check if base template exists
if [ ! -d "$BASE_TEMPLATE" ]; then
    echo "Base template not found at $BASE_TEMPLATE"
    echo "Creating base template..."
    mkdir -p "$BASE_TEMPLATE"
    cd "$BASE_TEMPLATE"
    git init
    echo "Base template initialized. Please add your base configuration and commit."
    echo "Then run this script again."
    exit 0
fi

# Check if project already exists
if [ -d "$NEW_PROJECT_PATH" ]; then
    echo "Error: Project directory already exists: $NEW_PROJECT_PATH"
    exit 1
fi

# Create worktree
cd "$BASE_TEMPLATE"
git worktree add "$NEW_PROJECT_PATH" -b "$PROJECT_NAME"

echo "✓ Worktree created: $NEW_PROJECT_PATH"
echo "✓ Branch: $PROJECT_NAME"
echo ""
echo "Next steps:"
echo "  cd $NEW_PROJECT_PATH"
echo "  # Customize your project"
echo "  git add ."
echo "  git commit -m 'Initial commit for $PROJECT_NAME'"
