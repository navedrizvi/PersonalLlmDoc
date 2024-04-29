MODEL_NAME = llama3
STACK_NAME = ollama-$(MODEL_NAME)-stack
MODEL_NAME := $(shell cat cdk-params.json | jq -r '.MODEL_NAME')
ECR_IMAGE_URI := $(shell cat cdk-params.json | jq -r '.ECR_IMAGE_URI')

build:
	npm run build

synth:
	npx cdk synth

# Passing RunOllamaLocally as true to run the model locally
# Passing RunOllamaLocally as false; if not passed, will run it at 1amUTC
deploy: build
	npx cdk deploy \
	--require-approval never \
	--context ModelName="${MODEL_NAME}" \
	--context RunOllamaLocally="true" \
	--context RunOnSchedule="false" \
	--stack-name $(STACK_NAME)

# TODO target needs to be fixed since Lambda ollama runnder is not working due to memory issues
deploy-with-runner: build
	npx cdk deploy \
	--require-approval never \
	--context ModelName="${MODEL_NAME}" \
	--context DockerImageUri="${ECR_IMAGE_URI}" \
	--stack-name $(STACK_NAME)

invoke:
	aws lambda invoke --function-name "ollama_${MODEL_NAME}_runner" \
		--payload '{"body": {"input_text": "hello, how are you?"}}' \
		--cli-binary-format raw-in-base64-out \
		output.txt
