#!/bin/bash
# uv workspace root lives at the repo root, so sync from there.
cd "$(dirname "$0")/.." || exit 1
uv sync
