An application to store health records and share it with [Ollama](https://ollama.com/) models. Try out the demo version here: [https://minimal-llm-ui-one.vercel.app](https://minimal-llm-ui-one.vercel.app)


## Demo Setup

1. Visit https://ollama.com/download and download
2. After installing, the `ollama` CLI should be available to you.
3. Pull the Ollama models:
```
ollama pull <model-name>
ollama pull medllama2
ollama pull llama3
```
4. Export this environment variable to allow cross origin requests to ollama:
```bash
export OLLAMA_ORIGINS="https://minimal-llm-ui-one.vercel.app/"
```
4. Serve the model from your localhost, will run on 11434 by default:
```bash
ollama serve
```
5. Now you should be able to access the models in the [UI](https://minimal-llm-ui-one.vercel.app/). Refresh if there is any issue. The UI will also show data from the personal health data store.


## Personal Deployment

You can deploy a Cloudformation stack to an AWS account. You will be paying for hosting the PHI in DynamoDB and S3. Make sure that the AWS credentials are set in your environment (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_REGION). You can build and deploy the application using the provided make target:
```bash
make deploy
```

Add your raw health records to phi-raw-records. Upload a directory (which contains the images of the document), it should have a unique name, as shown in the example. NOTE: Since the DynamoDB table for the EHR data has uses the name of the directory for partition key of the parsed document, do not keep the directory with same name and change its content since the contents will not get modified; instead create a new directory with a different name and the updated content.

Add more phi-raw-records to the S3 bucket (using the S3 upload CLI/API). The folder here serves to demonstrates example records that get uploaded to the bucked at deploy-time.


```bash
aws s3 cp 1-dental-visit/ s3://ollama-llama3-stack-phi-raw-records/1-dental-visit/ --recursive
```

If you upload directly like this you need to make sure file is in JPEG format, since Tesseract (OCR software) only recognizes images. Use a tool like this to achieve this: https://smallpdf.com/pdf-to-jpg. It will convert one page to a single image. You can delete pages which contain data that is irrelevant for the model, eg: the most important page would likely be the vitals, results and clinic notes therefore other pages can be removed from such patient visit records.

To save costs, make sure to delete the CDK stack and, if applicable, the ECR repo.

# Frontend
Front-end is available here: 
[https://github.com/navedrizvi/minimal-llm-ui](https://github.com/navedrizvi/minimal-llm-ui)
