#!/bin/bash

# AI-NEXUS ML API Startup Script for Linux/Mac
echo "========================================"
echo "  AI-NEXUS ML API Server"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

echo "[1/3] Checking Python version..."
python3 --version

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[2/3] Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "[2/3] Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "[3/3] Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

echo ""
echo "========================================"
echo "  Starting ML API Server..."
echo "  URL: http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the API server
# Store the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/app"
"$SCRIPT_DIR/venv/bin/python" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

