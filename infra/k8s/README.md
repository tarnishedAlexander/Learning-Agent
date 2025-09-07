# Learning Agent - Kubernetes Deployment

This directory contains all the necessary configuration files and scripts to deploy the Learning Agent application on Kubernetes.

## 📋 Prerequisites

Before deploying, ensure you have:

- **Kubernetes cluster** (Minikube, Docker Desktop, or cloud provider)
- **kubectl** installed and configured
- **Docker** (if using Minikube)
- **Environment files** properly configured:
  - `infra/docker/.env` - Infrastructure secrets (PostgreSQL, MinIO credentials)
  - `backend/.env` - Backend application configuration

## 🏗️ Architecture

The deployment consists of:

- **PostgreSQL** - Database with pgvector extension for vector operations
- **MinIO** - Object storage for document management
- **Jenkins** - CI/CD pipeline management
- **Backend** - NestJS API server (2 replicas)
- **Frontend** - React/Vite application (2 replicas)

All services run in the `learning-agent` namespace.

## 🚀 Quick Start

### 1. Automated Deployment

The easiest way to deploy is using the automated script:

```bash
cd infra/k8s
./deploy.sh
```

This will:
- ✅ Check prerequisites
- ✅ Build Docker images (if using Minikube)
- ✅ Create namespace and secrets
- ✅ Deploy all services
- ✅ Create MinIO bucket
- ✅ Wait for all pods to be ready

### 2. Manual Deployment

If you prefer manual control:

```bash
cd infra/k8s

# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create secrets from environment files
kubectl create secret generic infra-secrets \
  --from-env-file=../docker/.env \
  --namespace=learning-agent

kubectl create secret generic backend-env-secrets \
  --from-env-file=../../backend/.env \
  --namespace=learning-agent

# 3. Deploy infrastructure services
kubectl apply -f postgres-init-configmap.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f minio-deployment.yaml
kubectl apply -f jenkins-deployment.yaml

# 4. Deploy application services
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# 5. Wait for MinIO and create bucket
kubectl wait --for=condition=available --timeout=300s deployment/minio -n learning-agent
kubectl run minio-bucket-setup --rm -i --restart=Never --image=minio/mc \
  --namespace=learning-agent -- sh -c \
  "mc alias set myminio http://minio-service:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD && \
   mc mb myminio/documents --ignore-existing && \
   mc anonymous set download myminio/documents"
```

## 🔧 Environment Configuration

### Required Environment Files

#### `infra/docker/.env`
```env
# PostgreSQL Configuration
POSTGRES_USER=app_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=learning_agent

# MinIO Configuration
MINIO_ROOT_USER=your_minio_user
MINIO_ROOT_PASSWORD=your_minio_password
MINIO_BUCKET_NAME=documents
MINIO_ENDPOINT=http://localhost:9000
MINIO_REGION=us-east-1
```

#### `backend/.env`
```env
# Database
DATABASE_URL="postgresql://app_user:your_postgres_password@postgres-service:5432/learning_agent?schema=public"

# MinIO
MINIO_ENDPOINT=http://minio-service:9000
MINIO_ACCESS_KEY=your_minio_user
MINIO_SECRET_KEY=your_minio_password
MINIO_BUCKET_NAME=documents

# Application settings
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=3000

# AI/LLM Configuration (if applicable)
DEEPSEEK_API_KEY=your_deepseek_api_key
# ... other environment variables
```

## 📊 Monitoring & Management

### Check Deployment Status

```bash
# Using the script
./deploy.sh status

# Or manually
kubectl get all -n learning-agent
kubectl get pods -n learning-agent
```

### View Logs

```bash
# Using the script
./deploy.sh logs backend
./deploy.sh logs frontend

# Or manually
kubectl logs -n learning-agent deployment/backend --tail=50
kubectl logs -n learning-agent deployment/frontend --tail=50
```

### Access Applications

Set up port forwarding to access the applications:

```bash
# Backend API
kubectl port-forward -n learning-agent service/backend-service 3000:3000

# Frontend Application
kubectl port-forward -n learning-agent service/frontend-service 5173:5173

# MinIO Console
kubectl port-forward -n learning-agent service/minio-service 9090:9090

# Jenkins
kubectl port-forward -n learning-agent service/jenkins-service 8080:8080
```

Then access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MinIO Console**: http://localhost:9090
- **Jenkins**: http://localhost:8080

## 🛠️ Script Commands

The `deploy.sh` script supports multiple commands:

```bash
# Deploy the application (default)
./deploy.sh
./deploy.sh deploy

# Check deployment status
./deploy.sh status

# View service logs
./deploy.sh logs backend
./deploy.sh logs frontend
./deploy.sh logs postgres
./deploy.sh logs minio
./deploy.sh logs jenkins

# Complete cleanup (removes everything)
./deploy.sh cleanup
```

## 📁 File Structure

```
infra/k8s/
├── deploy.sh                     # Automated deployment script
├── namespace.yaml                # Kubernetes namespace definition
├── postgres-deployment.yaml      # PostgreSQL database with pgvector
├── postgres-init-configmap.yaml  # SQL scripts for pgvector setup
├── minio-deployment.yaml         # MinIO object storage
├── jenkins-deployment.yaml       # Jenkins CI/CD
├── backend-deployment.yaml       # NestJS backend API
├── frontend-deployment.yaml      # React frontend application
└── README.md                     # This file
```

## 🐳 Docker Images

The deployment uses these images:

- **Backend**: `learning-agent-backend:latest` (built from `backend/Dockerfile`)
- **Frontend**: `learning-agent-frontend:latest` (built from `client/Dockerfile`)
- **PostgreSQL**: `pgvector/pgvector:pg16`
- **MinIO**: `quay.io/minio/minio:latest`
- **Jenkins**: `jenkins/jenkins:lts`

### Building Images (Minikube)

If using Minikube, the script automatically builds images in Minikube's Docker environment:

```bash
# Manual build (if needed)
eval $(minikube docker-env)
docker build -t learning-agent-backend:latest ../../backend/
docker build -t learning-agent-frontend:latest ../../client/
```

## 🚨 Troubleshooting

### Common Issues

1. **Pods stuck in Pending state**
   ```bash
   kubectl describe pod <pod-name> -n learning-agent
   # Check for resource constraints or PVC issues
   ```

2. **MinIO bucket not created**
   ```bash
   # Manually create the bucket
   kubectl exec -n learning-agent deployment/minio -- mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
   kubectl exec -n learning-agent deployment/minio -- mc mb local/documents
   ```

3. **Backend database connection issues**
   ```bash
   # Check PostgreSQL is running and accessible
   kubectl logs -n learning-agent deployment/postgres
   kubectl exec -n learning-agent deployment/postgres -- pg_isready -U app_user -d learning_agent
   ```

4. **Images not found (Minikube)**
   ```bash
   # Ensure you're using Minikube's Docker environment
   eval $(minikube docker-env)
   docker images | grep learning-agent
   ```

### Health Checks

All services include health checks and liveness probes:

```bash
# Check service health
kubectl get pods -n learning-agent
kubectl describe pod <pod-name> -n learning-agent
```

## 🧹 Cleanup

To completely remove the deployment:

```bash
./deploy.sh cleanup
```

Or manually:

```bash
kubectl delete namespace learning-agent
```

## 🔒 Security Notes

- All secrets are stored in Kubernetes secrets, not in plain text
- Services communicate internally using ClusterIP services
- No services are exposed externally by default (use port-forwarding for access)
- MinIO bucket has controlled access policies

## 📈 Scaling

To scale the application:

```bash
# Scale backend
kubectl scale deployment backend --replicas=3 -n learning-agent

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n learning-agent
```

## 🤝 Contributing

When making changes to the Kubernetes configuration:

1. Update the relevant YAML files
2. Test the deployment with `./deploy.sh`
3. Update this README if needed
4. Ensure the `deploy.sh` script handles your changes

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. View pod logs: `./deploy.sh logs <service>`
3. Check pod status: `./deploy.sh status`
4. Verify environment configuration files exist and are correct
