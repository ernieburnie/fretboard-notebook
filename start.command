#!/bin/bash
# Serves the app at http://localhost:8765 (needed for the YouTube jam track) and opens it.
cd "$(dirname "$0")"
PORT=8765
if ! lsof -i :$PORT >/dev/null 2>&1; then
  python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:$PORT/index.html"
