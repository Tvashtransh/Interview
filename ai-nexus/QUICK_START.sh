#!/bin/bash

# AI-NEXUS Quick Start Script
# This script helps you start all services quickly

echo "🚀 AI-NEXUS Quick Start"
echo "========================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Function to start backend
start_backend() {
    echo "📦 Starting Backend..."
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm install
    fi
    npm run dev &
    BACKEND_PID=$!
    echo "   ✅ Backend started (PID: $BACKEND_PID)"
    cd ..
}

# Function to start ML API
start_ml_api() {
    echo "🐍 Starting ML API..."
    cd ml-api
    if [ ! -d "venv" ]; then
        echo "   Creating virtual environment..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    if [ ! -f "venv/bin/uvicorn" ]; then
        echo "   Installing dependencies..."
        pip install -r requirements.txt
    fi
    python -m uvicorn app.main:app --reload --port 8000 &
    ML_API_PID=$!
    echo "   ✅ ML API started (PID: $ML_API_PID)"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "⚛️  Starting Frontend..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm install
    fi
    npm run dev &
    FRONTEND_PID=$!
    echo "   ✅ Frontend started (PID: $FRONTEND_PID)"
    cd ..
}

# Start all services
start_backend
sleep 2

start_ml_api
sleep 2

start_frontend
sleep 2

echo ""
echo "🎉 All services started!"
echo ""
echo "📍 Services:"
echo "   - Backend:    http://localhost:5000"
echo "   - ML API:     http://localhost:8000"
echo "   - Frontend:   http://localhost:3000"
echo ""
echo "📝 To stop all services, press Ctrl+C"
echo ""

# Wait for user interrupt
wait

