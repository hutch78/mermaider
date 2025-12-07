#!/bin/bash

# Script to list all worktrees for Nuxt projects
# Usage: ./list-worktrees.sh

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT_DIR="$(dirname "$BASE_DIR")"
BASE_TEMPLATE="$PARENT_DIR/base-template"

if [ ! -d "$BASE_TEMPLATE" ]; then
    echo "Base template not found at $BASE_TEMPLATE"
    exit 1
fi

cd "$BASE_TEMPLATE"
echo "Worktrees:"
echo "----------"
git worktree list
