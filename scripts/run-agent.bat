@echo off
cd /d "%~dp0..\apps\agent"
uv run langgraph dev --port 8123 --no-browser
