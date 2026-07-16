#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this script from inside a fresh clone." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "The clone must be clean before rewriting history." >&2
  exit 1
fi

if command -v python3 >/dev/null 2>&1 \
  && python3 -m git_filter_repo --version >/dev/null 2>&1; then
  python_bin="python3"
elif command -v python >/dev/null 2>&1 \
  && python -m git_filter_repo --version >/dev/null 2>&1; then
  python_bin="python"
else
  echo "git-filter-repo is required: python -m pip install git-filter-repo" >&2
  exit 1
fi

origin_url="$(git remote get-url origin 2>/dev/null || true)"
replacements="$(mktemp)"
trap 'rm -f "$replacements"' EXIT

printf '%s\n' \
  'regex:sb_secret_[A-Za-z0-9_-]+==>***REMOVED_SUPABASE_SECRET***' \
  > "$replacements"

"$python_bin" -m git_filter_repo --force \
  --replace-text "$replacements" \
  --path .env \
  --path-glob '**/.env' \
  --path-glob '**/__pycache__/**' \
  --path-glob '**/*.pyc' \
  --invert-paths

if [[ -n "$origin_url" ]] && ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$origin_url"
fi

if git log --all -G 'sb_secret_[A-Za-z0-9_-]+' --format='%H' -- . | grep -q .; then
  echo "FAILED: a Supabase secret key is still present in history." >&2
  exit 1
fi

if git rev-list --objects --all | grep -Eq '(^|/)(\.env|__pycache__)(/|$)|\.pyc$'; then
  echo "FAILED: an environment file or Python cache is still present in history." >&2
  exit 1
fi

echo "History cleanup checks passed. Review the rewritten log before force-pushing."
