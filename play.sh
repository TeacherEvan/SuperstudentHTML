#!/bin/bash

# Super Student Game Launcher - Presentation Ready! 🎮
# Created for easy demo and presentation use

set -e  # Exit on any error

# Color codes for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}🎮 Super Student Game Launcher${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get local IP address
get_local_ip() {
    # Try different methods to get local IP
    if command_exists hostname; then
        hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost"
    elif command_exists ip; then
        ip route get 1 | awk '{print $NF;exit}' 2>/dev/null || echo "localhost"
    else
        echo "localhost"
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local port=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for server to start on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" >/dev/null 2>&1; then
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    return 1
}

# Function to cleanup background processes
cleanup() {
    print_status "Cleaning up..."
    pkill -f "vite" >/dev/null 2>&1 || true
    pkill -f "node.*5173" >/dev/null 2>&1 || true
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM

# Main execution
main() {
    print_header
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found! Are you in the correct directory?"
        print_status "Please run this script from the Super Student game directory."
        exit 1
    fi
    
    # Check Node.js installation
    print_status "Checking Node.js installation..."
    if ! command_exists node; then
        print_error "Node.js is not installed!"
        print_status "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check npm installation
    if ! command_exists npm; then
        print_error "npm is not installed!"
        print_status "Please install npm (usually comes with Node.js)"
        exit 1
    fi
    
    # Clean up any existing processes
    print_status "Cleaning up any existing game processes..."
    pkill -f "vite" >/dev/null 2>&1 || true
    pkill -f "node.*5173" >/dev/null 2>&1 || true
    
    # Install dependencies
    print_status "Installing dependencies..."
    if npm install --silent; then
        print_success "Dependencies installed successfully!"
        
        # Fix permissions for vite binary (common issue)
        if [ -f "node_modules/.bin/vite" ]; then
            chmod +x node_modules/.bin/vite 2>/dev/null || true
        fi
    else
        print_error "Failed to install dependencies!"
        print_status "Trying to fix with npm cache clean..."
        npm cache clean --force >/dev/null 2>&1 || true
        print_status "Retrying dependency installation..."
        npm install --silent || {
            print_error "Could not install dependencies. Please check your internet connection and try again."
            exit 1
        }
        
        # Fix permissions for vite binary (common issue)
        if [ -f "node_modules/.bin/vite" ]; then
            chmod +x node_modules/.bin/vite 2>/dev/null || true
        fi
    fi
    
    # Start the development server
    print_status "Starting Super Student game server..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to be ready
    if wait_for_server 3000; then
        print_success "Game server is running!"
        
        # Get local IP for network access
        LOCAL_IP=$(get_local_ip)
        
        # Print access information
        echo ""
        echo -e "${GREEN}🎮 Super Student Game is Ready!${NC}"
        echo -e "${GREEN}=================================${NC}"
        echo -e "${BLUE}Local Access:${NC}     http://localhost:3000"
        if [ "$LOCAL_IP" != "localhost" ]; then
            echo -e "${BLUE}Network Access:${NC}   http://$LOCAL_IP:3000"
        fi
        echo -e "${GREEN}=================================${NC}"
        echo ""
        echo -e "${YELLOW}📋 Controls:${NC}"
        echo -e "   • Mouse/Touch: Click on items to interact"
        echo -e "   • Space: Pause/Resume game"
        echo -e "   • R: Restart game (when paused/game over)"
        echo -e "   • Escape: Pause game or return to menu"
        echo ""
        echo -e "${YELLOW}🎯 Game Features:${NC}"
        echo -e "   • Colors Level: Match colors and learn color names"
        echo -e "   • Shapes Level: Identify and match geometric shapes"
        echo -e "   • Alphabet Level: Learn letters and alphabet recognition"
        echo -e "   • Numbers Level: Practice number recognition and counting"
        echo -e "   • Case Level: Distinguish between uppercase and lowercase"
        echo -e "   • Phonics Level: Learn letter sounds and pronunciation"
        echo ""
        echo -e "${CYAN}💡 Presentation Tips:${NC}"
        echo -e "   • Use F11 for fullscreen mode in browser"
        echo -e "   • Game auto-saves progress between levels"
        echo -e "   • Works on touch devices and interactive whiteboards"
        echo -e "   • Responsive design adapts to different screen sizes"
        echo ""
        echo -e "${PURPLE}🚀 To stop the game: Press Ctrl+C${NC}"
        echo ""
        
        # Auto-open browser if available
        if command_exists xdg-open; then
            print_status "Opening game in browser..."
            xdg-open "http://localhost:3000" >/dev/null 2>&1 &
        elif command_exists open; then
            print_status "Opening game in browser..."
            open "http://localhost:3000" >/dev/null 2>&1 &
        else
            print_status "Please open your browser and navigate to http://localhost:3000"
        fi
        
        # Keep the script running
        wait $SERVER_PID
    else
        print_error "Failed to start game server!"
        print_status "Please check the logs above for error details."
        kill $SERVER_PID >/dev/null 2>&1 || true
        exit 1
    fi
}

# Run main function
main "$@"