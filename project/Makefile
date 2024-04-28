MODEL_NAME = llama2
STACK_NAME = ollama-$(MODEL_NAME)-stack
MODEL_NAME := $(shell cat cdk-params.json | jq -r '.MODEL_NAME')
ECR_IMAGE_URI := $(shell cat cdk-params.json | jq -r '.ECR_IMAGE_URI')

build:
	npm run build

synth:
	npx cdk synth

deploy-with-runner:
	npx cdk deploy \
	--stack-name $(STACK_NAME) \ 
	--context ModelName="${MODEL_NAME}" \
	--context DockerImageUri="${ECR_IMAGE_URI}"

# Passing RunOllamaLocally as true to run the model locally
deploy:
	npx cdk deploy \
	--context RunOllamaLocally="true" \
	--stack-name $(STACK_NAME)

invoke:
	aws lambda invoke --function-name "ollama_${MODEL_NAME}_runner" \
		--payload '{"body": {"input_text": "hello, how are you?"}}' \
		--cli-binary-format raw-in-base64-out \
		output.txt
