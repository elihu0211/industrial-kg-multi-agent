#!/bin/bash
cd "$(dirname "$0")/../apps/agent" || exit 1
uv run langgraph dev --port 8123 --no-browser
