#!/usr/bin/env bash
# =============================================================================
# module-docs.sh - write the inputs, outputs and resources lists into the
# README of each module (between the BEGIN_TF_DOCS and END_TF_DOCS markers).
# -----------------------------------------------------------------------------
#   ./tools/module-docs.sh           write the lists
#   ./tools/module-docs.sh --check   change nothing; exit 1 if a list is old
#
# Needs terraform-docs (https://terraform-docs.io), 0.20 or later.
# Settings: ../.terraform-docs.yml. Reads the .tf files only: no sign-in, no
# state, no provider download.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

command -v terraform-docs >/dev/null 2>&1 || {
  echo "missing dependency: terraform-docs (https://terraform-docs.io)" >&2
  exit 1
}

check=0
[[ "${1:-}" == "--check" ]] && check=1

old=0
for d in modules/*/; do
  if (( check )); then
    terraform-docs -c .terraform-docs.yml --output-check "$d" >/dev/null 2>&1 || {
      echo "not current: ${d}README.md"
      old=1
    }
  else
    terraform-docs -c .terraform-docs.yml "$d" >/dev/null
  fi
done

if (( old )); then
  echo "Run ./tools/module-docs.sh, then commit the result." >&2
  exit 1
fi
echo "module docs: ok"
