#!/bin/bash

# Interactive Port Cleanup Script for VS Code Debugging
# Checks for port conflicts and prompts user to resolve them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ports to check
FRONTEND_PORT=4000
BACKEND_PORT=4001

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to get process info for a port
get_port_info() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN | tail -n +2
}

# Function to kill processes on a port
kill_port_processes() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || echo "")
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        return 0
    else
        return 1
    fi
}

# Function to prompt user for action
prompt_user() {
    local port=$1
    local service_name=$2
    
    echo ""
    log_warning "Port $port is currently in use by:"
    get_port_info $port
    echo ""
    
    while true; do
        echo -e "${YELLOW}What would you like to do?${NC}"
        echo "1) Kill processes and continue"
        echo "2) Skip this port" 
        echo "3) Abort debugging"
        echo ""
        read -p "Enter your choice (1/2/3): " choice
        
        case $choice in
            1|y|Y|yes|YES)
                log_info "Killing processes on port $port..."
                if kill_port_processes $port; then
                    log_success "Processes on port $port killed successfully"
                    return 0
                else
                    log_error "Failed to kill processes on port $port"
                    return 1
                fi
                ;;
            2|s|S|skip|SKIP)
                log_warning "Skipping port $port - debugging may fail"
                return 1
                ;;
            3|n|N|no|NO|abort|ABORT)
                log_info "Aborting debug session"
                exit 1
                ;;
            *)
                echo "Invalid choice. Please enter 1, 2, or 3."
                ;;
        esac
    done
}

# Main execution
main() {
    echo ""
    log_info "🔍 Checking for port conflicts before debugging..."
    echo ""
    
    local conflicts_found=false
    
    # Check frontend port
    if check_port $FRONTEND_PORT; then
        conflicts_found=true
        if ! prompt_user $FRONTEND_PORT "Frontend (Next.js)"; then
            log_warning "Frontend port $FRONTEND_PORT not cleared"
        fi
    else
        log_success "Frontend port $FRONTEND_PORT is available"
    fi
    
    # Check backend port  
    if check_port $BACKEND_PORT; then
        conflicts_found=true
        if ! prompt_user $BACKEND_PORT "Backend (tRPC)"; then
            log_warning "Backend port $BACKEND_PORT not cleared"
        fi
    else
        log_success "Backend port $BACKEND_PORT is available"
    fi
    
    # Final status
    echo ""
    if [ "$conflicts_found" = false ]; then
        log_success "🎉 All ports are clear! Ready to start debugging."
    else
        log_info "🚀 Port cleanup completed. Starting debug session..."
    fi
    echo ""
    
    # Small delay to let user see the results
    sleep 1
}

# Handle script interruption
trap 'echo ""; log_info "Port cleanup cancelled by user"; exit 1' INT

# Run main function
main "$@" 