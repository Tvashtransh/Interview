#!/bin/bash
# Script to kill process on port 5000 (or specified port)

PORT=${1:-5000}

echo "🔍 Checking for processes on port $PORT..."

# Find process using the port
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "✅ Port $PORT is already free!"
    exit 0
fi

echo "🛑 Killing process on port $PORT (PID: $PID)..."
kill -9 $PID 2>/dev/null

sleep 1

# Verify port is free
if lsof -ti:$PORT >/dev/null 2>&1; then
    echo "❌ Failed to free port $PORT"
    exit 1
else
    echo "✅ Port $PORT is now free!"
    exit 0
fi

