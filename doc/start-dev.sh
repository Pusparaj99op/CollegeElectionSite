#!/bin/bash

# College Election System - Development Helper Script
# Purpose: Start the development server with automatic port detection and conflict resolution
# Version: 1.1.0
# Last Modified: August 1, 2025
#
# This script now uses an improved port management system that:
# 1. Checks for port availability
# 2. Attempts graceful shutdown of processes before forced kills
# 3. Automatically falls back to alternative ports when needed
# 4. Integrates with the enhanced server.js port handling

echo "🚀 College Election System - Development Server"
echo "================================================"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on port
kill_port() {
    local port=$1
    echo "🔄 Killing existing processes on port $port..."

    # First try to gracefully kill Node processes
    echo "Attempting graceful shutdown of Node processes..."
    pkill -SIGINT -f "node server.js" 2>/dev/null
    sleep 2

    # Check if port is still in use
    if ! check_port $port; then
        echo "✅ Port freed successfully through graceful shutdown"
        return 0
    fi

    # Try multiple methods to kill the process if graceful shutdown failed
    if command -v fuser >/dev/null 2>&1; then
        fuser -k ${port}/tcp 2>/dev/null
    fi

    # Alternative method using lsof
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "Force killing process $pid on port $port"
        kill -9 $pid 2>/dev/null
    fi

    # Last resort - kill any node server processes
    pkill -9 -f "node server.js" 2>/dev/null

    sleep 3
}

# Function to start server on available port
start_server() {
    local port=$1
    echo "🌟 Starting server on port $port..."
    echo "📱 Access your application at: http://localhost:$port"
    echo "⏹️  Press Ctrl+C to stop the server"
    echo ""

    # Use our port management system that will handle conflicts automatically
    PORT=$port NODE_OPTIONS="--unhandled-rejections=strict" npm run dev
}

# Main logic
PREFERRED_PORT=3000
ALTERNATIVE_PORT=3001

echo "🔍 Checking port availability..."

if check_port $PREFERRED_PORT; then
    echo "⚠️  Port $PREFERRED_PORT is in use!"
    read -p "🤔 Do you want to kill the existing process? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port $PREFERRED_PORT

        # Check again after killing
        if check_port $PREFERRED_PORT; then
            echo "❌ Could not free port $PREFERRED_PORT, trying port $ALTERNATIVE_PORT..."
            if check_port $ALTERNATIVE_PORT; then
                echo "❌ Port $ALTERNATIVE_PORT is also in use!"
                echo "💡 Try running: pkill -f 'node server.js' and run this script again"
                exit 1
            else
                start_server $ALTERNATIVE_PORT
            fi
        else
            echo "✅ Port $PREFERRED_PORT is now free!"
            start_server $PREFERRED_PORT
        fi
    else
        echo "🔄 Using alternative port $ALTERNATIVE_PORT..."
        if check_port $ALTERNATIVE_PORT; then
            echo "❌ Port $ALTERNATIVE_PORT is also in use!"
            echo "💡 Try running: pkill -f 'node server.js' and run this script again"
            exit 1
        else
            start_server $ALTERNATIVE_PORT
        fi
    fi
else
    echo "✅ Port $PREFERRED_PORT is available!"
    start_server $PREFERRED_PORT
fi
