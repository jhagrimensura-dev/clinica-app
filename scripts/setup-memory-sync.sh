#!/bin/bash
# Setup memory sync — roda uma vez no Mac/Linux
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MEMORY_SRC="$REPO_DIR/memory"
PROJECT_HASH=$(echo "$REPO_DIR" | sed 's|/|-|g' | sed 's/^-//')
CLAUDE_MEMORY="$HOME/.claude/projects/$PROJECT_HASH/memory"

echo "Repo: $REPO_DIR"
echo "Claude memory path: $CLAUDE_MEMORY"

mkdir -p "$(dirname "$CLAUDE_MEMORY")"

if [ -d "$CLAUDE_MEMORY" ] && [ ! -L "$CLAUDE_MEMORY" ]; then
  echo "Backup da memória local..."
  cp -r "$CLAUDE_MEMORY" "${CLAUDE_MEMORY}_backup"
  rm -rf "$CLAUDE_MEMORY"
fi

ln -sf "$MEMORY_SRC" "$CLAUDE_MEMORY"
echo "✅ Sincronização de memória configurada!"
