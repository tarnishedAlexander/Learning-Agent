#!/bin/bash

# Learning Agent Kubernetes Deployment Script
# This script deploys the complete Learning Agent application to Kubernetes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
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

# Check if kubectl is installed
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    print_success "kubectl is available"
}

# Check if Minikube is running (optional - works with any Kubernetes cluster)
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        print_error "No Kubernetes cluster found. Please ensure your cluster is running."
        print_warning "If using Minikube, run: minikube start"
        exit 1
    fi
    print_success "Kubernetes cluster is accessible"
}

# Check if Docker images exist (for Minikube)
check_images() {
    print_status "Checking if application images exist..."
    
    # Check if we're in Minikube environment
    if kubectl config current-context | grep -q "minikube"; then
        print_status "Minikube detected. Switching to Minikube's Docker environment..."
        eval $(minikube docker-env)
        
        # Check for required images
        if ! docker images | grep -q "learning-agent-backend"; then
            print_warning "Backend image not found. Building..."
            docker build -t learning-agent-backend:latest ../../backend/
        fi
        
        if ! docker images | grep -q "learning-agent-frontend"; then
            print_warning "Frontend image not found. Building..."
            docker build -t learning-agent-frontend:latest ../../client/
        fi
    else
        print_warning "Not using Minikube. Make sure your images are available in your cluster's registry."
    fi
}

# Create namespace
create_namespace() {
    print_status "Creating namespace..."
    kubectl apply -f namespace.yaml
    print_success "Namespace created/updated"
}

# Create secrets from .env files
create_secrets() {
    print_status "Creating secrets from .env files..."
    
    # Check if .env files exist
    if [ ! -f "../docker/.env" ]; then
        print_error "infra/docker/.env file not found. Please create it first."
        exit 1
    fi
    
    if [ ! -f "../../backend/.env" ]; then
        print_error "backend/.env file not found. Please create it first."
        exit 1
    fi
    
    # Create infra secrets from docker/.env
    kubectl create secret generic infra-secrets \
        --from-env-file=../docker/.env \
        --namespace=learning-agent \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create backend secrets from backend/.env
    kubectl create secret generic backend-env-secrets \
        --from-env-file=../../backend/.env \
        --namespace=learning-agent \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_success "Secrets created/updated"
}

# Deploy PostgreSQL with initialization
deploy_postgres() {
    print_status "Deploying PostgreSQL with pgvector extension..."
    kubectl apply -f postgres-init-configmap.yaml
    kubectl apply -f postgres-deployment.yaml
    print_success "PostgreSQL deployed"
}

# Deploy MinIO
deploy_minio() {
    print_status "Deploying MinIO object storage..."
    kubectl apply -f minio-deployment.yaml
    print_success "MinIO deployed with bucket creation job"
}

# Deploy Jenkins
deploy_jenkins() {
    print_status "Deploying Jenkins CI/CD..."
    kubectl apply -f jenkins-deployment.yaml
    print_success "Jenkins deployed"
}

# Deploy backend
deploy_backend() {
    print_status "Deploying backend application..."
    kubectl apply -f backend-deployment.yaml
    print_success "Backend deployed"
}

# Deploy frontend
deploy_frontend() {
    print_status "Deploying frontend application..."
    kubectl apply -f frontend-deployment.yaml
    print_success "Frontend deployed"
}

# Wait for all deployments
wait_for_deployments() {
    print_status "Waiting for all deployments to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n learning-agent
    kubectl wait --for=condition=available --timeout=300s deployment/minio -n learning-agent
    kubectl wait --for=condition=available --timeout=300s deployment/jenkins -n learning-agent
    kubectl wait --for=condition=available --timeout=300s deployment/backend -n learning-agent
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n learning-agent
    
    print_success "All deployments are ready!"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    kubectl get pods -n learning-agent
    echo ""
    kubectl get services -n learning-agent
    echo ""
    print_success "Learning Agent application deployed successfully!"
    echo ""
    print_status "To access the applications:"
    echo "  Backend API:    kubectl port-forward -n learning-agent service/backend-service 3000:3000"
    echo "  Frontend:       kubectl port-forward -n learning-agent service/frontend-service 5173:5173"
    echo "  MinIO Console:  kubectl port-forward -n learning-agent service/minio-service 9090:9090"
    echo "  Jenkins:        kubectl port-forward -n learning-agent service/jenkins-service 8080:8080"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up completed jobs..."
    kubectl delete jobs -n learning-agent -l app!=keep 2>/dev/null || true
}

# Main deployment function
main() {
    print_status "Starting Learning Agent Kubernetes deployment..."
    echo ""
    
    check_kubectl
    check_cluster
    check_images
    
    create_namespace
    create_secrets
    
    deploy_postgres
    deploy_minio
    deploy_jenkins
    deploy_backend
    deploy_frontend
    
    wait_for_deployments
    cleanup
    show_status
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "cleanup")
        print_status "Cleaning up Learning Agent deployment..."
        kubectl delete namespace learning-agent 2>/dev/null || true
        print_success "Cleanup completed"
        ;;
    "status")
        kubectl get all -n learning-agent
        ;;
    "logs")
        if [ -z "$2" ]; then
            print_error "Usage: $0 logs <service-name>"
            print_status "Available services: postgres, minio, jenkins, backend, frontend"
            exit 1
        fi
        kubectl logs -n learning-agent deployment/$2 --tail=50
        ;;
    *)
        echo "Usage: $0 [deploy|cleanup|status|logs <service>]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the complete Learning Agent application (default)"
        echo "  cleanup  - Remove the entire deployment"
        echo "  status   - Show deployment status"
        echo "  logs     - Show logs for a specific service"
        echo ""
        echo "Examples:"
        echo "  $0                    # Deploy the application"
        echo "  $0 deploy            # Deploy the application"
        echo "  $0 status            # Check deployment status"
        echo "  $0 logs backend      # View backend logs"
        echo "  $0 cleanup           # Remove everything"
        ;;
esac
