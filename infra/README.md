# Learning Agent Infrastructure

This directory contains the Kubernetes deployment configuration for the Learning Agent application.

## 🚀 Quick Start

### Prerequisites

- **Kubernetes cluster** (minikube, kind, or cloud provider)
- **kubectl** configured and connected to your cluster
- **Docker** (for building images)

### Deploy Everything

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Learning-Agent/infra/k8s
   ```

2. **Run the deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## 📁 Structure

```
infra/
├── k8s/                  # Kubernetes manifests
│   ├── deploy.sh         # Kubernetes deployment script
│   ├── README.md         # Detailed Kubernetes documentation
│   └── *.yaml           # Kubernetes manifests
└── docker/              # Docker Compose files (legacy)
```

## 🔧 Configuration

The deployment uses environment variables from `.env` files:

- **infra/docker/.env** - Infrastructure services (PostgreSQL, MinIO)
- **backend/.env** - Backend application configuration

Make sure these files exist and are properly configured before deployment.

## 📋 Services Deployed

- **Backend API** (NestJS) - Port 3000
- **Frontend** (React/Vite) - Port 5173  
- **PostgreSQL** with pgvector - Port 5432
- **MinIO** (Object Storage) - Port 9000/9090
- **Jenkins** (CI/CD) - Port 8080

## 🛠️ Management Commands

```bash
cd infra/k8s

# Deploy
./deploy.sh

# Check status
./deploy.sh status

# Cleanup
./deploy.sh cleanup
```

## 📖 Documentation

For detailed Kubernetes documentation, see: [k8s/README.md](k8s/README.md)


