# Learning Agent - Windows Setup Script
# This script installs all prerequisites for the Learning Agent application
# Run this in PowerShell as Administrator

# Colors for output (Windows PowerShell compatible)
function Write-Status($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Install Chocolatey
function Install-Chocolatey {
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Success "Chocolatey is already installed"
    } else {
        Write-Status "Installing Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Success "Chocolatey installed"
    }
}

# Install Docker Desktop
function Install-Docker {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Success "Docker is already installed"
    } else {
        Write-Status "Installing Docker Desktop..."
        choco install docker-desktop -y
        Write-Success "Docker Desktop installed"
        Write-Warning "Please restart your computer and start Docker Desktop"
        Write-Warning "Make sure to enable Kubernetes in Docker Desktop settings"
    }
}

# Install kubectl
function Install-Kubectl {
    if (Get-Command kubectl -ErrorAction SilentlyContinue) {
        Write-Success "kubectl is already installed"
    } else {
        Write-Status "Installing kubectl..."
        choco install kubernetes-cli -y
        Write-Success "kubectl installed"
    }
}

# Install Minikube
function Install-Minikube {
    if (Get-Command minikube -ErrorAction SilentlyContinue) {
        Write-Success "Minikube is already installed"
    } else {
        Write-Status "Installing Minikube..."
        choco install minikube -y
        Write-Success "Minikube installed"
    }
}

# Install Node.js and npm
function Install-NodeJS {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = node --version
        Write-Success "Node.js is already installed ($nodeVersion)"
    } else {
        Write-Status "Installing Node.js and npm..."
        choco install nodejs -y
        Write-Success "Node.js and npm installed"
    }
}

# Install Git
function Install-Git {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Success "Git is already installed"
    } else {
        Write-Status "Installing Git..."
        choco install git -y
        Write-Success "Git installed"
    }
}

# Verify Docker is working
function Test-Docker {
    Write-Status "Verifying Docker installation..."
    
    try {
        $dockerVersion = docker --version
        Write-Success "Docker version: $dockerVersion"
        
        # Test Docker with hello-world
        docker run --rm hello-world | Out-Null
        Write-Success "Docker is working correctly"
    }
    catch {
        Write-Error "Docker is not working properly"
        Write-Status "Please make sure Docker Desktop is running"
        Write-Status "You may need to restart your computer if you just installed Docker"
        exit 1
    }
}

# Main installation function
function Main {
    Write-Status "🚀 Starting Learning Agent setup for Windows..."
    Write-Host ""
    
    if (-not (Test-Administrator)) {
        Write-Error "This script must be run as Administrator"
        Write-Status "Please right-click PowerShell and select 'Run as Administrator'"
        exit 1
    }
    
    Install-Chocolatey
    Install-Git
    Install-Docker
    Install-Kubectl
    Install-Minikube
    Install-NodeJS
    
    Write-Host ""
    Write-Success "🎉 All prerequisites installed successfully!"
    Write-Success "🧠 Your mental health is safe! ✨"
    Write-Host ""
    Write-Status "Next steps:"
    Write-Host "  1. Restart your computer if you installed Docker Desktop"
    Write-Host "  2. Start Docker Desktop and enable Kubernetes"
    Write-Host "  3. Open PowerShell and run: cd Learning-Agent\infra\k8s"
    Write-Host "  4. Run: .\deploy.sh (or bash deploy.sh if you have Git Bash)"
    Write-Host ""
    Write-Warning "Note: You may need to restart your terminal to refresh PATH"
    Write-Warning "If using WSL2, make sure Docker Desktop has WSL2 integration enabled"
}

# Run main function
Main
