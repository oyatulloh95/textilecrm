#!/bin/bash
# EC2 Launch Template user-data script for TextileCRM
# Installs Docker, logs into ECR, pulls latest images, and starts containers
# behind the instance — the ALB Target Group forwards traffic to this instance.

set -e

AWS_REGION="eu-central-1"
ECR_REGISTRY="<ACCOUNT_ID>.dkr.ecr.${AWS_REGION}.amazonaws.com"

# 1. Install Docker
yum update -y
yum install -y docker
systemctl enable docker
systemctl start docker

# 2. Authenticate Docker with Amazon ECR
aws ecr get-login-password --region ${AWS_REGION} \
  | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# 3. Pull latest images
docker pull ${ECR_REGISTRY}/textilecrm-backend:latest
docker pull ${ECR_REGISTRY}/textilecrm-frontend:latest

# 4. Create a private network so containers can talk to each other
docker network create textilecrm-net || true

# 5. Run database (for demo only — production should use Amazon RDS)
docker run -d --name textilecrm-db --network textilecrm-net \
  --restart unless-stopped \
  -e POSTGRES_USER=textilecrm \
  -e POSTGRES_PASSWORD=textilecrm \
  -e POSTGRES_DB=textilecrm \
  postgres:16-alpine

# 6. Run backend container (listens on 8000, ALB health check on /health)
docker run -d --name textilecrm-backend --network textilecrm-net \
  --restart unless-stopped \
  -e DATABASE_URL=postgresql://textilecrm:textilecrm@textilecrm-db:5432/textilecrm \
  -p 8000:8000 \
  ${ECR_REGISTRY}/textilecrm-backend:latest

# 7. Run frontend container (listens on 80, ALB health check on /healthz)
docker run -d --name textilecrm-frontend --network textilecrm-net \
  --restart unless-stopped \
  -p 80:80 \
  ${ECR_REGISTRY}/textilecrm-frontend:latest
