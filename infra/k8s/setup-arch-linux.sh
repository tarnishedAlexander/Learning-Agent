#!/bin/bash

# Learning Agent - Arch Linux Setup Script
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user."
        exit 1
    fi
}

# Update system
update_system() {
    print_status "Updating system packages..."
    sudo pacman -Syu --noconfirm
    print_success "System updated"
}

# Install Docker
install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
    else
        print_status "Installing Docker..."
        sudo pacman -S --noconfirm docker docker-compose
        
        # Enable and start Docker service
        sudo systemctl enable docker
        sudo systemctl start docker
        
        # Add user to docker group
        sudo usermod -aG docker $USER
        print_success "Docker installed"
        print_warning "You may need to log out and back in for Docker group changes to take effect"
    fi
}

# Install kubectl
install_kubectl() {
    if command -v kubectl &> /dev/null; then
        print_success "kubectl is already installed"
    else
        print_status "Installing kubectl..."
        sudo pacman -S --noconfirm kubectl
        print_success "kubectl installed"
    fi
}

# Install Minikube
install_minikube() {
    if command -v minikube &> /dev/null; then
        print_success "Minikube is already installed"
    else
        print_status "Installing Minikube..."
        
        # Download and install Minikube
        curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
        sudo install minikube-linux-amd64 /usr/local/bin/minikube
        rm minikube-linux-amd64
        
        print_success "Minikube installed"
    fi
}

# Install Node.js and npm (for development)
install_nodejs() {
    if command -v node &> /dev/null; then
        print_success "Node.js is already installed ($(node --version))"
    else
        print_status "Installing Node.js and npm..."
        sudo pacman -S --noconfirm nodejs npm
        print_success "Node.js and npm installed"
    fi
}

# Install Git (if not present)
install_git() {
    if command -v git &> /dev/null; then
        print_success "Git is already installed"
    else
        print_status "Installing Git..."
        sudo pacman -S --noconfirm git
        print_success "Git installed"
    fi
}

# Verify Docker is working
verify_docker() {
    print_status "Verifying Docker installation..."
    
    if docker --version &> /dev/null; then
        print_success "Docker version: $(docker --version)"
    else
        print_error "Docker is not working properly"
        print_status "Try running: sudo systemctl start docker"
        print_status "Or logout and login again if you just installed Docker"
        exit 1
    fi
    
    # Test Docker with hello-world (if user is in docker group)
    if groups $USER | grep -q docker; then
        if docker run --rm hello-world &> /dev/null; then
            print_success "Docker is working correctly"
        else
            print_warning "Docker daemon might not be running"
            print_status "Starting Docker daemon..."
            sudo systemctl start docker
        fi
    else
        print_warning "User not in docker group yet. Please logout and login again."
    fi
}

# Main installation function
main() {
    print_status "🚀 Starting Learning Agent setup for Arch Linux..."
    echo ""
    
    check_root
    update_system
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
    echo "  1. If you just installed Docker, logout and login again"
    echo "  2. Run: cd Learning-Agent/infra/k8s"
    echo "  3. Run: ./deploy.sh"
    echo ""
    print_warning "Note: If you get permission errors with Docker, run:"
    print_warning "  sudo usermod -aG docker \$USER"
    print_warning "  Then logout and login again"
}

# Run main function
main "$@"
