#!/bin/bash

# Automatic Port Cleanup Script for VS Code Debugging
# Automatically kills processes on development ports without prompting

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ports to check
PORTS=(4000 4001)

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to kill processes on a port
kill_port_processes() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || echo "")
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 0.5
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    log_info "🧹 Checking and clearing development ports..."
    
    for port in "${PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Port $port is in use - killing processes..."
            if kill_port_processes $port; then
                log_success "Port $port cleared"
            else
                log_warning "Could not clear port $port"
            fi
        else
            log_success "Port $port is available"
        fi
    done
    
    log_success "🎉 Port cleanup completed!"
    sleep 0.5
}

# Run main function
main "$@" 