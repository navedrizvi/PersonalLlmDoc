#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <model-name> <image-name> <repo-name>"
  exit 1
fi

CURRENT_TIME_URI=$(date +%s)

MODEL_NAME="$1"
IMAGE_NAME="$2"
REPO_NAME="$3"

echo "Pushing $MODEL_NAME model to ECR..."
echo "Image name: $IMAGE_NAME"
echo "Repository name: $REPO_NAME"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Authenticating Docker with ECR..."
aws ecr get-login-password | docker login --username AWS --password-stdin "$ECR_URI"

# Create ECR repository if it doesn't exist
if ! aws ecr describe-repositories --repository-names "$REPO_NAME" &>/dev/null; then
  echo "Creating ECR repository $REPO_NAME..."
  aws ecr create-repository --repository-name "$REPO_NAME"
fi

echo "Building Docker image..."
if ! docker build --platform linux/amd64 -t "$IMAGE_NAME" ./ --build-arg MODEL_NAME="$MODEL_NAME"; then
  echo "Docker image failed to build."
  exit 1
fi
echo "Docker image built successfully."

FULL_URI="$ECR_URI/$REPO_NAME:$CURRENT_TIME_URI"  # Correct the URI format
echo "FULL_URI: $FULL_URI"

echo "Tagging Docker image as latest..."
docker tag "$IMAGE_NAME" "$FULL_URI"
docker tag "$FULL_URI" "$FULL_URI:latest"

echo "Pushing Docker image to ECR..."
docker push "$FULL_URI:latest"

echo "ECR push successful"

echo "$FULL_URI:latest"

# Create the output JSON file containing the deployment parameters
echo "{
  \"ECR_IMAGE_URI\": \"$FULL_URI:latest\",
  \"MODEL_NAME\": \"$MODEL_NAME\"
}" > ../cdk-params.json
