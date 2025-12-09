#!/bin/bash
# Script to build and push Docker images to ECR
# Run this after Docker is available in your environment

set -e

ECR_REGISTRY="236763662741.dkr.ecr.us-east-1.amazonaws.com"
AWS_REGION="us-east-1"

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo ""
echo "🐳 Building frontend image..."
cd frontend
docker build -t "$ECR_REGISTRY/spotsave-frontend:latest" .
docker push "$ECR_REGISTRY/spotsave-frontend:latest"
cd ..

echo ""
echo "🐳 Building backend image..."
cd backend
docker build -t "$ECR_REGISTRY/spotsave-backend:latest" .
docker push "$ECR_REGISTRY/spotsave-backend:latest"
cd ..

echo ""
echo "✅ Images built and pushed successfully!"
echo ""
echo "🚀 Now trigger deployments:"
echo "  aws apprunner start-deployment --service-arn 'arn:aws:apprunner:us-east-1:236763662741:service/spotsave-frontend/310522d22b874448957fc7f4daac044b'"
echo "  aws apprunner start-deployment --service-arn 'arn:aws:apprunner:us-east-1:236763662741:service/spotsave-backend/2976eeac3e3545ca9c26afa89c225ec0'"

