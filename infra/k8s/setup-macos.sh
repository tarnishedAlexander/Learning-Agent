#!/bin/bash

# Learning Agent - macOS Setup Script
# This script installs all prerequisites for the Learning Agent application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check if Homebrew is installed
check_homebrew() {
    if ! command -v brew &> /dev/null; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ $(uname -m) == "arm64" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
        
        print_success "Homebrew installed"
    else
        print_success "Homebrew is already installed"
        print_status "Updating Homebrew..."
        brew update
    fi
}

# Install Docker Desktop
install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
    else
        print_status "Installing Docker Desktop..."
        brew install --cask docker
        
        print_success "Docker Desktop installed"
        print_warning "Please start Docker Desktop from Applications folder"
        print_warning "Wait for Docker to fully start before continuing"
        
        read -p "Press Enter after Docker Desktop is running..."
    fi
}

# Install kubectl
install_kubectl() {
    if command -v kubectl &> /dev/null; then
        print_success "kubectl is already installed"
    else
        print_status "Installing kubectl..."
        brew install kubectl
        print_success "kubectl installed"
    fi
}

# Install Minikube
install_minikube() {
    if command -v minikube &> /dev/null; then
        print_success "Minikube is already installed"
    else
        print_status "Installing Minikube..."
        brew install minikube
        print_success "Minikube installed"
    fi
}

# Install Node.js and npm
install_nodejs() {
    if command -v node &> /dev/null; then
        print_success "Node.js is already installed ($(node --version))"
    else
        print_status "Installing Node.js and npm..."
        brew install node
        print_success "Node.js and npm installed"
    fi
}

# Install Git
install_git() {
    if command -v git &> /dev/null; then
        print_success "Git is already installed"
    else
        print_status "Installing Git..."
        brew install git
        print_success "Git installed"
    fi
}

# Verify Docker is working
verify_docker() {
    print_status "Verifying Docker installation..."
    
    # Wait for Docker Desktop to be ready
    local max_attempts=30
    local attempt=0
    
    while ! docker info &> /dev/null; do
        if [ $attempt -eq $max_attempts ]; then
            print_error "Docker Desktop is not running"
            print_status "Please start Docker Desktop and try again"
            exit 1
        fi
        
        print_status "Waiting for Docker Desktop to start... ($((attempt + 1))/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_success "Docker is running"
    
    # Test Docker with hello-world
    if docker run --rm hello-world &> /dev/null; then
        print_success "Docker is working correctly"
    else
        print_error "Docker test failed"
        exit 1
    fi
}

# Main installation function
main() {
    print_status "🚀 Starting Learning Agent setup for macOS..."
    echo ""
    
    check_homebrew
    install_git
    install_docker
    install_kubectl
    install_minikube
    install_nodejs
    verify_docker
    
    echo ""
    print_success "🎉 All prerequisites installed successfully!"
    print_success "🧠 Your mental health is safe! ✨"
    echo ""
    print_status "Next steps:"
    echo "  1. Make sure Docker Desktop is running"
    echo "  2. Run: cd Learning-Agent/infra/k8s"
    echo "  3. Run: ./deploy.sh"
    echo ""
    print_warning "Note: If you encounter any permission issues:"
    print_warning "  Make sure Docker Desktop is running and you have agreed to its terms"
}

# Run main function
main "$@"
