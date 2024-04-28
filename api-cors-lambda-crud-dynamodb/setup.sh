#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

PUSH_ECR_SCRIPT="scripts/push_ecr.sh"

DEFAULT_MODEL_NAME="llama2"

MODEL_NAME="${1:-$DEFAULT_MODEL_NAME}"

IMAGE_NAME="ollama-${MODEL_NAME}-image"
REPO_NAME="ollama-${MODEL_NAME}-repo"

echo "Setting up $MODEL_NAME model..."

# Capture the script output and error code
SCRIPT_RESPONSE=$($PUSH_ECR_SCRIPT "$MODEL_NAME" "$IMAGE_NAME" "$REPO_NAME" 2>&1)
SCRIPT_EXIT_STATUS=$?

# Check if there was an error in the script execution
if [ $SCRIPT_EXIT_STATUS -ne 0 ]; then
  echo "Error: Failed to push ECR image. Aborting."
  echo "Nested error: $SCRIPT_RESPONSE"  # Print nested error
  exit 1
fi

ECR_IMAGE_URI=$(echo "$SCRIPT_RESPONSE" | tail -n 1)

echo "ECR push successful"


# Check if there was an error in the script execution
if [ $? -ne 0 ]; then
  echo "Error: Failed to push ECR image. Aborting."
  echo "Nested error: $SCRIPT_RESPONSE"  # Print nested error
  exit 1
fi

# Create a JSON file containing the deployment parameters
echo "{
  \"ECR_IMAGE_URI\": \"$ECR_IMAGE_URI\",
  \"MODEL_NAME\": \"$MODEL_NAME\"
}" > cdk-params.json
