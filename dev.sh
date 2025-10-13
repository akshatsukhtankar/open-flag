#!/bin/bash
# Development helper scripts for OpenFlag

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$PROJECT_ROOT/.venv"

# Ensure we're in the project root
cd "$PROJECT_ROOT"

case "$1" in
  install)
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    if [ ! -d "$VENV_PATH" ]; then
      python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install -r backend/requirements.txt
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    ;;

  test)
    echo -e "${BLUE}Running backend tests...${NC}"
    source .venv/bin/activate
    PYTHONPATH="$PROJECT_ROOT/backend" pytest backend/ -v
    ;;

  dev)
    echo -e "${BLUE}Starting backend development server...${NC}"
    source .venv/bin/activate
    cd backend
    PYTHONPATH="$PROJECT_ROOT/backend" uvicorn app.main:app --reload --port 8000
    ;;

  format)
    echo -e "${BLUE}Formatting Python code...${NC}"
    source .venv/bin/activate
    black backend/
    echo -e "${GREEN}✓ Code formatted${NC}"
    ;;

  lint)
    echo -e "${BLUE}Linting Python code...${NC}"
    source .venv/bin/activate
    flake8 backend/ --max-line-length=100 --exclude=.venv
    echo -e "${GREEN}✓ Linting passed${NC}"
    ;;

  clean)
    echo -e "${BLUE}Cleaning up...${NC}"
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    rm -rf backend/.pytest_cache backend/openflag.db
    echo -e "${GREEN}✓ Cleaned${NC}"
    ;;

  *)
    echo "OpenFlag Development Helper"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install   - Install backend dependencies"
    echo "  test      - Run backend tests"
    echo "  dev       - Start backend development server"
    echo "  format    - Format Python code with black"
    echo "  lint      - Lint Python code with flake8"
    echo "  clean     - Clean up cache and temp files"
    echo ""
    exit 1
    ;;
esac
