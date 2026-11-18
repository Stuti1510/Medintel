#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  MEDINTEL AI - Local Research Platform Launcher"
echo "==================================================="

# 1. Check Python 3.10+
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "[ERROR] Python 3 is not installed or not in PATH. Please install Python 3.10+."
    exit 1
fi

PY_BIN=$(command -v python3 || command -v python)

# 2. Check Node.js 18+
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH. Please install Node.js 18+."
    exit 1
fi

# 3. Activate virtual environment if present
if [ -d "venv" ]; then
    echo "[INFO] Activating virtual environment (venv)..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "[INFO] Activating virtual environment (.venv)..."
    source .venv/bin/activate
fi

# 4. Check dependencies
echo "[INFO] Verifying Python dependencies..."
$PY_BIN -m pip install -r requirements.txt -q

if [ ! -d "frontend/node_modules" ]; then
    echo "[INFO] Installing frontend npm packages..."
    npm --prefix frontend install
fi

# Process cleanup on exit
BACKEND_PID=""
cleanup() {
    echo ""
    echo "[INFO] Shutting down MEDINTEL AI local services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "==================================================="
echo "  MEDINTEL AI is running locally:"
echo "    Frontend:  http://localhost:5173"
echo "    Backend:   http://127.0.0.1:8000"
echo "    API docs:  http://127.0.0.1:8000/docs"
echo "  Press Ctrl+C to stop."
echo "==================================================="
echo ""

# Start FastAPI backend in background
$PY_BIN -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Start Vite frontend in foreground
npm --prefix frontend run dev
