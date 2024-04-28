MODEL_NAME = llama2
STACK_NAME = ollama-$MODEL_NAME-serverless

ECR_IMAGE_URI = 

build:
	npm run build

synth:
	npx cdk synth

deploy:
	npx cdk deploy \
	--stack-name $STACK_NAME \
	--parameters DockerImageUri="$ECR_IMAGE_URI" \
	--parameters ModelName="$MODEL_NAME"

