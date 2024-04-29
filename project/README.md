# APIGateway with CORS, Lambdas, and CRUD on DynamoDB

## <!--BEGIN STABILITY BANNER-->

![Stability: Stable](https://img.shields.io/badge/stability-Stable-success.svg?style=for-the-badge)

> **This is a stable example. It should successfully build out of the box**
>
> This examples is built on Construct Libraries marked "Stable" and does not have any infrastructure prerequisites to build.

---

<!--END STABILITY BANNER-->

This an example of an APIGateway with CORS enabled, pointing to five Lambdas executing CRUD operations on a single DynamoDB table.

## Build

To build this app, you need to be in this example's root folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
npm run build
```

This will install the necessary CDK, then this example's dependencies, then the lambda functions' dependencies, and then build your TypeScript files and your CloudFormation template.

## Deploy

Run `cdk deploy`. This will deploy / redeploy your Stack to your AWS Account.

After the deployment you will see the API's URL, which represents the url you can then use.

## The Component Structure

The whole component contains:

- An API, with CORS enabled on all HTTP Methods. (Use with caution, for production apps you will want to enable only a certain domain origin to be able to query your API.)
- Lambda pointing to `lambdas/create.ts`, containing code for **storing** an item into the DynamoDB table.
- Lambda pointing to `lambdas/delete-one.ts`, containing code for **deleting** an item from the DynamoDB table.
- Lambda pointing to `lambdas/get-all.ts`, containing code for **getting all items** from the DynamoDB table.
- Lambda pointing to `lambdas/get-one.ts`, containing code for **getting an item** from the DynamoDB table.
- Lambda pointing to `lambdas/update-one.ts`, containing code for **updating an item** in the DynamoDB table.
- A DynamoDB table `items` that stores the data.
- Five `LambdaIntegrations` that connect these Lambdas to the API.

## CDK Toolkit

The [`cdk.json`](./cdk.json) file in the root of this repository includes
instructions for the CDK toolkit on how to execute this program.

After building your TypeScript code, you will be able to run the CDK toolkit commands as usual:

```bash
    $ cdk ls
    <list all stacks in this program>

    $ cdk synth
    <generates and outputs cloudformation template>

    $ cdk deploy
    <deploys stack to your account>

    $ cdk diff
    <shows diff against deployed stack>
```

=========

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
