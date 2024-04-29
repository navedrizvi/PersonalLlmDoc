make sure docker is up

run setup script to push to ecr and fill deployment params (the generated imageuri)

```bash
cd docker
./push_ecr.sh <model-name> ollama-<model-name>-image ollama-<model-name>-repo

# where model-name is the name of the ollama model to use in the back-end
```

run cdk deployment

### 4. Test AWS Lambda Function

Run the code below to test your AWS Lambda Function. You might need to invoke it twice to make sure the ollama server is running. The result will be written to ./output.txt

```bash
make invoke
```

resources you will end up paying for:

- ECR storage

===
local docker setup (recommended):

lsof -i ::11434

ollama pull <model-name>
ollama pull medllama2

export OLLAMA_ORIGINS="https://minimal-llm-ui-git-main-rizvinaved1997s-projects.vercel.app"

add to phi-raw-records. upload a directory (which contains the images of the health react), it should have a unique name, as shown in the example. NOTE: do not keep the file with same name but change its contents, the contents will not get modified; instead create a new file with a different name and the updated contents.

add more phi-raw-records to the S3 bucket (using the S3 upload CLI/API). The folder here serves to demonstrates example records, and get uploaded to the bucked at deploy-time.

aws s3 cp 1-dental-visit/ s3://ollama-llama3-stack-phi-raw-records/1-dental-visit/ --recursive
if you upload directly like this you need to make sure file is in JPEG format, since Tesseract (OCR software) only recognizes images. Use a tool like this to achieve this: https://smallpdf.com/pdf-to-jpg. It will convert one page to a single image. You can delete pages which contain data that is irrelevant for the model, eg: the most important page would likely be the vitals, results and clinic notes therefore other pages can be removed from such patient visit records.

To save costs, make sure to delete the CDK stack and, if applicable, the ECR repo.

# Frontend

Credit for front end goes to @richawo: https://github.com/richawo/minimal-llm-ui
