# Learning Agent - Quick Setup Guide

This guide will help you set up the Learning Agent application on any machine with automated scripts that handle all prerequisites and deployment.

## 🚀 Quick Start (All Platforms)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd Learning-Agent
```

### 2. Run Setup Script for Your Platform

#### 🐧 Arch Linux
```bash
cd infra/k8s
chmod +x setup-arch-linux.sh
./setup-arch-linux.sh
```

#### 🍎 macOS
```bash
cd infra/k8s
chmod +x setup-macos.sh
./setup-macos.sh
```

#### 🪟 Windows
Open PowerShell as Administrator and run:
```powershell
cd infra\k8s
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-windows.ps1
```

### 3. Deploy the Application
After the setup script completes successfully:

```bash
cd infra/k8s
./deploy.sh
```

## 🎯 What Gets Installed

The setup scripts automatically install:
- **Docker** (Docker Desktop on macOS/Windows)
- **kubectl** (Kubernetes command-line tool)
- **Minikube** (Local Kubernetes cluster)
- **Node.js & npm** (For development)
- **Git** (Version control)

## 🌐 Access URLs

After successful deployment, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MinIO Console**: http://localhost:9090
- **Jenkins**: http://localhost:8080
- **PostgreSQL**: localhost:5432

### MinIO Credentials:
- Username: `adminminio`
- Password: `adminpassword`

## 🛠️ Available Commands

```bash
# Deploy everything (default)
./deploy.sh

# Check deployment status
./deploy.sh status

# View logs for a specific service
./deploy.sh logs backend
./deploy.sh logs frontend
./deploy.sh logs minio

# Start only port-forwarding (if deployment exists)
./deploy.sh port-forward

# Stop port-forwarding
./deploy.sh stop-forward

# Clean up everything
./deploy.sh cleanup
```

## 🔧 Troubleshooting

### Common Issues:

1. **Docker Permission Errors (Linux)**:
   ```bash
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

2. **Minikube Won't Start**:
   ```bash
   minikube delete
   minikube start --kubernetes-version=v1.28.2
   ```

3. **Port Already in Use**:
   ```bash
   ./deploy.sh stop-forward
   ./deploy.sh port-forward
   ```

4. **Images Not Building**:
   ```bash
   ./deploy.sh cleanup
   ./deploy.sh
   ```

## 🏗️ Architecture

The application consists of:

- **Frontend** (React + Vite): Port 5173
- **Backend** (NestJS): Port 3000
- **PostgreSQL** (with pgvector): Port 5432
- **MinIO** (S3-compatible storage): Ports 9000/9090
- **Jenkins** (CI/CD): Port 8080

All services run in a Kubernetes cluster managed by Minikube with automatic port-forwarding for local development.

## 🧠 Mental Health Status: PROTECTED ✨

This setup is designed to "just work" across all platforms without manual configuration headaches!

## 📝 Notes

- **First Run**: May take 10-15 minutes to download and build all images
- **Subsequent Runs**: Much faster (2-3 minutes)
- **Resource Usage**: Requires ~4GB RAM and ~10GB disk space
- **Internet Required**: For downloading images and dependencies

## 🆘 Need Help?

If you encounter any issues:

1. Check the logs: `./deploy.sh logs <service-name>`
2. Verify status: `./deploy.sh status`
3. Clean and retry: `./deploy.sh cleanup && ./deploy.sh`

The deployment script includes extensive error handling and automatic retries for common issues.
